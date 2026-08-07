import { useCallback, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/queryKeys'
import { useAuth } from '../contexts/AuthContext'
import { canPredictMatch } from '../utils/matchTiming'

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

/**
 * Pronósticos del usuario para una fecha.
 *
 * El embed es `matches!inner` y no `matches`: en PostgREST, filtrar por columnas
 * de un recurso embebido sin inner join no descarta las filas de arriba, así que
 * con el embed común esto traía todo el historial del usuario en cada cambio de
 * fecha.
 *
 * @param {number|null} roundNumber
 * @param {string|null} tournamentId
 */
export const usePredictions = (roundNumber = null, tournamentId = null) => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const userId = user?.id ?? null

  const { data, isPending, error } = useQuery({
    queryKey: queryKeys.predictions(tournamentId, roundNumber, userId),
    enabled: Boolean(userId) && Boolean(roundNumber),
    queryFn: async () => {
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

  const createMutation = useMutation({
    mutationFn: async ({ matchId, homePrediction, awayPrediction, qualifierPredictionId }) => {
      // Revalidación contra la fecha real del partido: el guard de la UI puede
      // estar desactualizado si la pestaña quedó abierta un rato largo.
      const { data: match } = await supabase
        .from('matches')
        .select('match_date')
        .eq('id', matchId)
        .single()

      if (match && !canPredictMatch(match.match_date)) {
        throw new Error('Ya no se pueden cargar predicciones para este partido')
      }

      const { data: created, error: createError } = await supabase
        .from('predictions')
        .insert([
          {
            user_id: userId,
            match_id: matchId,
            home_prediction: homePrediction,
            away_prediction: awayPrediction,
            qualifier_prediction_id: qualifierPredictionId,
          },
        ])
        .select()

      if (createError) throw createError
      return created
    },
    onSuccess: invalidatePredictions,
  })

  const updateMutation = useMutation({
    mutationFn: async ({ predictionId, homePrediction, awayPrediction, qualifierPredictionId }) => {
      const { data: updated, error: updateError } = await supabase
        .from('predictions')
        .update({
          home_prediction: homePrediction,
          away_prediction: awayPrediction,
          qualifier_prediction_id: qualifierPredictionId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', predictionId)
        .eq('user_id', userId)
        .select()

      if (updateError) throw updateError
      return updated
    },
    onSuccess: invalidatePredictions,
  })

  const batchUpsertMutation = useMutation({
    mutationFn: async predictionsData => {
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

  /** Se conserva el contrato { data, error } que ya usan los componentes. */
  const runMutation = useCallback(
    async (mutation, variables) => {
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

  const createPrediction = useCallback(
    (matchId, homePrediction, awayPrediction, qualifierPredictionId = null) =>
      runMutation(createMutation, {
        matchId,
        homePrediction,
        awayPrediction,
        qualifierPredictionId,
      }),
    [runMutation, createMutation]
  )

  const updatePrediction = useCallback(
    (predictionId, homePrediction, awayPrediction, qualifierPredictionId = null) =>
      runMutation(updateMutation, {
        predictionId,
        homePrediction,
        awayPrediction,
        qualifierPredictionId,
      }),
    [runMutation, updateMutation]
  )

  const batchUpsertPredictions = useCallback(
    predictionsData => runMutation(batchUpsertMutation, predictionsData),
    [runMutation, batchUpsertMutation]
  )

  const getUserPredictionForMatch = useCallback(
    matchId => predictions.find(prediction => prediction.match_id === matchId),
    [predictions]
  )

  return {
    predictions,
    // Sin usuario o sin fecha la query queda deshabilitada; para el consumidor
    // eso no es "cargando".
    loading: Boolean(userId) && Boolean(roundNumber) && isPending,
    error: error ? error.message : null,
    fetchPredictions: invalidatePredictions,
    createPrediction,
    updatePrediction,
    batchUpsertPredictions,
    getUserPredictionForMatch,
  }
}
