import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/queryKeys'
import { useAuth } from '../contexts/AuthContext'

/** Mapea los 14 campos del formulario a los parámetros de las RPC. */
const toRpcParams = (tournamentId, values) => ({
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

const EMPTY_DATA = {
  config: null,
  teams: [],
  prediction: null,
  officialResults: null,
  bonusScore: null,
  stats: { totalPredictions: 0 },
}

export const useWorldCupBonus = tournamentId => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const userId = user?.id ?? null

  const { data, isPending, error } = useQuery({
    queryKey: queryKeys.worldCupBonus(tournamentId, userId),
    enabled: Boolean(tournamentId),
    queryFn: async () => {
      const requests = [
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
      ]

      if (userId) {
        requests.push(
          supabase
            .from('world_cup_predictions')
            .select('*')
            .eq('tournament_id', tournamentId)
            .eq('user_id', userId)
            .maybeSingle(),
          supabase
            .from('world_cup_bonus_scores')
            .select('*')
            .eq('tournament_id', tournamentId)
            .eq('user_id', userId)
            .maybeSingle()
        )
      }

      const [configRes, teamsRes, officialRes, countRes, predictionRes, bonusRes] =
        await Promise.all(requests)

      const failed = [configRes, teamsRes, officialRes, countRes, predictionRes, bonusRes].find(
        response => response?.error
      )
      if (failed) throw failed.error

      return {
        config: configRes.data,
        teams: (teamsRes.data || [])
          .map(item => item.teams)
          .filter(Boolean)
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
    async (name, params, { alsoInvalidateLeaderboard = false } = {}) => {
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
    values => runRpc('upsert_world_cup_prediction', toRpcParams(tournamentId, values)),
    [runRpc, tournamentId]
  )

  const adminSetLock = useCallback(
    ({ enabled, lockAt }) =>
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
    values =>
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
