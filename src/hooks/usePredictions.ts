import { useCallback, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/queryKeys'
import { useAuth } from '../contexts/AuthContext'
import type { Match, Prediction, TeamSummary, Uuid } from '../types/domain'
import type { MutationError, PredictionUpsertInput } from './types'

const PREDICTION_WITH_MATCH = `
  *,
  matches!inner (
    id,
    home_team_id,
    away_team_id,
    home_team:teams!matches_home_team_id_fkey(id, name, slug, logo_url),
    away_team:teams!matches_away_team_id_fkey(id, name, slug, logo_url),
    match_date,
    home_score,
    away_score,
    is_finished,
    round_number,
    is_playoff,
    playoff_stage,
    qualifier_team_id
  )
`

/** El partido embebido: un subconjunto de columnas más los dos equipos. */
export interface PredictionMatch extends Pick<
  Match,
  | 'id'
  | 'home_team_id'
  | 'away_team_id'
  | 'match_date'
  | 'home_score'
  | 'away_score'
  | 'is_finished'
  | 'round_number'
  | 'is_playoff'
  | 'playoff_stage'
  | 'qualifier_team_id'
> {
  home_team: TeamSummary | null
  away_team: TeamSummary | null
}

/** El partido no es opcional porque el embed es `!inner`: sin partido no hay fila. */
export interface PredictionWithMatch extends Prediction {
  matches: PredictionMatch
}

/**
 * Pronósticos del usuario para una fecha.
 *
 * El embed es `matches!inner` y no `matches`: en PostgREST, filtrar por columnas
 * de un recurso embebido sin inner join no descarta las filas de arriba, así que
 * con el embed común esto traía todo el historial del usuario en cada cambio de
 * fecha.
 */
export const usePredictions = (
  roundNumber: number | null = null,
  tournamentId: Uuid | null = null
) => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const userId: Uuid | null = user?.id ?? null

  const { data, isPending, error } = useQuery({
    queryKey: queryKeys.predictions(tournamentId, roundNumber, userId),
    enabled: Boolean(userId) && Boolean(roundNumber),
    queryFn: async (): Promise<PredictionWithMatch[]> => {
      let query = supabase
        .from('predictions')
        .select(PREDICTION_WITH_MATCH)
        .eq('user_id', userId)
        .eq('matches.round_number', roundNumber)

      if (tournamentId) {
        query = query.eq('matches.tournament_id', tournamentId)
      }

      const { data: predictions, error: predictionsError } = await query

      if (predictionsError) throw predictionsError
      return predictions || []
    },
  })

  // useMemo y no `data ?? []` a secas: el array literal seria una referencia
  // nueva por render y romperia la memoizacion de todo lo que dependa de el.
  const predictions = useMemo(() => data ?? [], [data])

  const invalidatePredictions = useCallback(
    () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.predictions(tournamentId, roundNumber, userId),
      }),
    [queryClient, tournamentId, roundNumber, userId]
  )

  /**
   * Acá vivian `createMutation` y `updateMutation`, que no llamaba nadie: el unico
   * camino de escritura es el upsert batch de `PredictionForm`. Se borraron porque
   * `createMutation` era el unico lugar con una revalidacion del cutoff contra la
   * fecha real del partido, y tenerla ahi daba a entender que la capa de datos
   * protegia el cierre de pronosticos cuando en realidad no corria nunca.
   *
   * Quien protege el cutoff hoy es el filtro de `PredictionForm`
   * (`matches.filter(canPredictMatch)`), evaluado al momento de guardar. La base no
   * lo valida: las policies de `predictions` solo chequean `user_id = auth.uid()`.
   * Si algun dia hace falta que sea una regla y no una convencion de la UI, el
   * lugar es un trigger en `predictions`, no este hook.
   */
  const batchUpsertMutation = useMutation({
    mutationFn: async (predictionsData: PredictionUpsertInput[]) => {
      const now = new Date().toISOString()
      const rows = predictionsData.map(
        ({ matchId, homePrediction, awayPrediction, qualifierPredictionId = null }) => ({
          user_id: userId,
          match_id: matchId,
          home_prediction: homePrediction,
          away_prediction: awayPrediction,
          qualifier_prediction_id: qualifierPredictionId,
          updated_at: now,
        })
      )

      const { data: upserted, error: upsertError } = await supabase
        .from('predictions')
        .upsert(rows, { onConflict: 'user_id,match_id', ignoreDuplicates: false })
        .select()

      if (upsertError) throw upsertError
      return upserted
    },
    onSuccess: invalidatePredictions,
  })

  /**
   * Se conserva el contrato { data, error } que ya usan los componentes.
   *
   * Ojo con el tipo del error: la rama de "no autenticado" devuelve un **string** y
   * el resto devuelve el error de PostgREST. Es lo que ya hacía, y hoy no molesta
   * porque el único consumidor (`PredictionForm`) lo usa como booleano — pero si
   * alguien leyera `error.message` en esa rama, obtendría `undefined`. Unificarlo
   * es un cambio de comportamiento, así que queda anotado y no tocado.
   */
  const runMutation = useCallback(
    async <TVars, TData>(
      mutation: { mutateAsync: (variables: TVars) => Promise<TData> },
      variables: TVars
    ): Promise<{ data: TData | null; error: MutationError | string | null }> => {
      if (!userId) return { data: null, error: 'No autenticado' }

      try {
        const result = await mutation.mutateAsync(variables)
        return { data: result, error: null }
      } catch (error) {
        return { data: null, error }
      }
    },
    [userId]
  )

  const batchUpsertPredictions = useCallback(
    (predictionsData: PredictionUpsertInput[]) => runMutation(batchUpsertMutation, predictionsData),
    [runMutation, batchUpsertMutation]
  )

  const getUserPredictionForMatch = useCallback(
    (matchId: Uuid): PredictionWithMatch | undefined =>
      predictions.find(prediction => prediction.match_id === matchId),
    [predictions]
  )

  return {
    predictions,
    // Sin usuario o sin fecha la query queda deshabilitada; para el consumidor
    // eso no es "cargando".
    loading: Boolean(userId) && Boolean(roundNumber) && isPending,
    error: error ? error.message : null,
    fetchPredictions: invalidatePredictions,
    batchUpsertPredictions,
    getUserPredictionForMatch,
  }
}
