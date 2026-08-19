import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/queryKeys'
import { useAuth } from '../contexts/AuthContext'
import type {
  ArgentinaStage,
  Fn,
  Tables,
  TeamSummary,
  Uuid,
  WorldCupPrediction,
} from '../types/domain'
import type { MutationError } from './types'

/**
 * TODO(mundial): la migración a react query de este hook NO se validó contra la
 * app. Se decidió no probarla en la fase 3b porque el próximo mundial es en 2030
 * y el único torneo `world_cup` de la base (`mundial-2026`) está `finished`, o sea
 * que las escrituras de admin no se pueden ejercitar sin tocar datos reales.
 *
 * Lo que quedó sin probar, cuando haya que retomarlo (ver la sección 5 de
 * `docs/pruebas-fase-3b.md`):
 *   - que el formulario de bonus cargue con los valores ya guardados
 *   - guardar una respuesta y que persista al recargar (`upsert_world_cup_prediction`)
 *   - el bloqueo desde el panel admin (`admin_set_world_cup_lock`,
 *     `admin_lock_world_cup_predictions`)
 *   - cargar resultados oficiales
 *   - `recalculate_world_cup_bonus` y, sobre todo, que la tabla de posiciones
 *     refleje los puntos nuevos SIN recargar la página: es lo que depende de que
 *     la invalidación alcance a la query del leaderboard con bonus
 *   - el contador de pronósticos cargados del panel admin
 *
 * Para probarlo hace falta un torneo de prueba con `type = 'world_cup'`, `status
 * = 'active'` y su fila en `world_cup_bonus_config`.
 */

/**
 * Las 14 respuestas tal como las maneja el formulario, sin el prefijo `p_`.
 *
 * Es el mismo conjunto que la fila de `world_cup_predictions` menos las columnas de
 * auditoría, y sirve para las dos cosas: el pronóstico de un usuario y los
 * resultados oficiales que carga el admin.
 */
export type WorldCupBonusValues = Partial<{
  champion_team_id: Uuid | ''
  runner_up_team_id: Uuid | ''
  third_place_team_id: Uuid | ''
  top_scorer_text: string
  best_player_text: string
  best_goalkeeper_text: string
  least_goals_conceded_team_id: Uuid | ''
  revelation_team_id: Uuid | ''
  most_assists_text: string
  most_cards_team_id: Uuid | ''
  will_there_be_hat_trick: boolean | null
  argentina_stage: ArgentinaStage | ''
  final_goals: number | ''
  best_debutant_team_id: Uuid | ''
}>

/**
 * Mapea los 14 campos del formulario a los parámetros de las RPC.
 *
 * Las dos RPC que lo reciben —`upsert_world_cup_prediction` y
 * `admin_upsert_world_cup_official_results`— declaran **exactamente los mismos 15
 * argumentos**, lo que confirma que compartir este mapa es correcto y no una
 * casualidad. El tipo sale del esquema generado, así que si una de las dos cambia
 * su firma, esto deja de compilar.
 *
 * Ojo con una imprecisión del esquema: los argumentos figuran como `string` no
 * nullable, pero acá se mandan `null` para las preguntas sin responder. En SQL eso
 * se acepta (la columna es `text`); el tipo generado es más estricto que la función
 * real, y cuando se prenda `strict` va a haber que resolverlo (probablemente
 * declarando los parámetros con `default null` en la base).
 */
const toRpcParams = (
  tournamentId: Uuid | null,
  values: WorldCupBonusValues
): Fn<'upsert_world_cup_prediction'>['Args'] => ({
  p_tournament_id: tournamentId,
  p_champion_team_id: values.champion_team_id || null,
  p_runner_up_team_id: values.runner_up_team_id || null,
  p_third_place_team_id: values.third_place_team_id || null,
  p_top_scorer_text: values.top_scorer_text || null,
  p_best_player_text: values.best_player_text || null,
  p_best_goalkeeper_text: values.best_goalkeeper_text || null,
  p_least_goals_conceded_team_id: values.least_goals_conceded_team_id || null,
  p_revelation_team_id: values.revelation_team_id || null,
  p_most_assists_text: values.most_assists_text || null,
  p_most_cards_team_id: values.most_cards_team_id || null,
  p_will_there_be_hat_trick: values.will_there_be_hat_trick,
  p_argentina_stage: values.argentina_stage || null,
  p_final_goals: values.final_goals === '' ? null : values.final_goals,
  p_best_debutant_team_id: values.best_debutant_team_id || null,
})

/** Todo lo que la pantalla del bonus necesita, en una sola query. */
export interface WorldCupBonusData {
  config: Tables<'world_cup_bonus_config'> | null
  teams: TeamSummary[]
  prediction: WorldCupPrediction | null
  officialResults: Tables<'world_cup_official_results'> | null
  bonusScore: Tables<'world_cup_bonus_scores'> | null
  stats: { totalPredictions: number }
}

/** Referencia estable para el estado vacío: ver el comentario de `useMatches`. */
const EMPTY_DATA: WorldCupBonusData = {
  config: null,
  teams: [],
  prediction: null,
  officialResults: null,
  bonusScore: null,
  stats: { totalPredictions: 0 },
}

/** Las cinco RPC del bonus. El tipo de sus argumentos sale del esquema generado. */
type WorldCupRpcName =
  | 'upsert_world_cup_prediction'
  | 'admin_set_world_cup_lock'
  | 'admin_lock_world_cup_predictions'
  | 'admin_upsert_world_cup_official_results'
  | 'recalculate_world_cup_bonus'

export const useWorldCupBonus = (tournamentId: Uuid | null) => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const userId: Uuid | null = user?.id ?? null

  const { data, isPending, error } = useQuery({
    queryKey: queryKeys.worldCupBonus(tournamentId, userId),
    enabled: Boolean(tournamentId),
    queryFn: async (): Promise<WorldCupBonusData> => {
      /**
       * Las seis consultas van en un solo `Promise.all`, y las dos que dependen del
       * usuario entran como `null` cuando no hay sesión.
       *
       * Antes era un array al que se le hacía `push`, y eso obligaba a destructurar
       * seis posiciones de un array de largo variable: TypeScript no puede seguir
       * eso (el tipo de cada elemento queda como la unión de todos). Con la tupla
       * cada respuesta conserva su tipo, y el paralelismo es el mismo: sin usuario
       * no se construyen las dos consultas de más.
       */
      const [configRes, teamsRes, officialRes, countRes, predictionRes, bonusRes] =
        await Promise.all([
          supabase
            .from('world_cup_bonus_config')
            .select('*')
            .eq('tournament_id', tournamentId)
            .maybeSingle(),
          supabase
            .from('world_cup_teams')
            .select('team_id, teams:teams!world_cup_teams_team_id_fkey(id, name, slug, logo_url)')
            .eq('tournament_id', tournamentId)
            .order('created_at', { ascending: true }),
          supabase
            .from('world_cup_official_results')
            .select('*')
            .eq('tournament_id', tournamentId)
            .maybeSingle(),
          // El contador entra en el mismo Promise.all: antes iba en un await
          // suelto al final, sin depender de nada de lo anterior.
          supabase
            .from('world_cup_predictions')
            .select('id', { count: 'exact', head: true })
            .eq('tournament_id', tournamentId),
          userId
            ? supabase
                .from('world_cup_predictions')
                .select('*')
                .eq('tournament_id', tournamentId)
                .eq('user_id', userId)
                .maybeSingle()
            : null,
          userId
            ? supabase
                .from('world_cup_bonus_scores')
                .select('*')
                .eq('tournament_id', tournamentId)
                .eq('user_id', userId)
                .maybeSingle()
            : null,
        ])

      const failed = [configRes, teamsRes, officialRes, countRes, predictionRes, bonusRes].find(
        response => response?.error
      )
      if (failed) throw failed.error

      return {
        config: configRes.data,
        teams: (teamsRes.data || [])
          .map(item => item.teams)
          .filter((team): team is TeamSummary => Boolean(team))
          .sort((a, b) => a.name.localeCompare(b.name, 'es')),
        officialResults: officialRes.data,
        prediction: predictionRes?.data || null,
        bonusScore: bonusRes?.data || null,
        stats: { totalPredictions: countRes.count || 0 },
      }
    },
  })

  const invalidateBonus = useCallback(
    () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.worldCupBonus(tournamentId, userId),
      }),
    [queryClient, tournamentId, userId]
  )

  const runRpc = useCallback(
    async <N extends WorldCupRpcName>(
      name: N,
      params: Fn<N>['Args'],
      { alsoInvalidateLeaderboard = false }: { alsoInvalidateLeaderboard?: boolean } = {}
    ): Promise<{ data: unknown; error: MutationError | null }> => {
      const { data: rpcData, error: rpcError } = await supabase.rpc(name, params)

      if (rpcError) return { data: null, error: rpcError }

      await invalidateBonus()

      // Recalcular el bonus cambia los puntos de la tabla con bonus incluido.
      if (alsoInvalidateLeaderboard) {
        await queryClient.invalidateQueries({
          queryKey: [tournamentId ?? null, 'leaderboard'],
        })
      }

      return { data: rpcData, error: null }
    },
    [invalidateBonus, queryClient, tournamentId]
  )

  const upsertPrediction = useCallback(
    (values: WorldCupBonusValues) =>
      runRpc('upsert_world_cup_prediction', toRpcParams(tournamentId, values)),
    [runRpc, tournamentId]
  )

  const adminSetLock = useCallback(
    ({ enabled, lockAt }: { enabled: boolean; lockAt: string }) =>
      runRpc('admin_set_world_cup_lock', {
        p_tournament_id: tournamentId,
        p_enabled: enabled,
        p_lock_at: lockAt,
      }),
    [runRpc, tournamentId]
  )

  const adminForceLock = useCallback(
    () => runRpc('admin_lock_world_cup_predictions', { p_tournament_id: tournamentId }),
    [runRpc, tournamentId]
  )

  const adminUpsertOfficialResults = useCallback(
    (values: WorldCupBonusValues) =>
      runRpc('admin_upsert_world_cup_official_results', toRpcParams(tournamentId, values), {
        alsoInvalidateLeaderboard: true,
      }),
    [runRpc, tournamentId]
  )

  const adminRecalculateBonus = useCallback(
    () =>
      runRpc(
        'recalculate_world_cup_bonus',
        { p_tournament_id: tournamentId },
        { alsoInvalidateLeaderboard: true }
      ),
    [runRpc, tournamentId]
  )

  const resolved = data ?? EMPTY_DATA

  return {
    ...resolved,
    loading: Boolean(tournamentId) && isPending,
    error: error ? error.message : null,
    fetchData: invalidateBonus,
    upsertPrediction,
    adminSetLock,
    adminForceLock,
    adminUpsertOfficialResults,
    adminRecalculateBonus,
  }
}
