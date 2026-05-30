import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { PREDICTION_CUTOFF_MINUTES } from '../constants/predictions'

export const usePredictions = (roundNumber = null, tournamentId = null) => {
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchPredictions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, roundNumber, tournamentId])

  const fetchPredictions = async () => {
    if (!user) return

    // Si no hay roundNumber, no traer nada
    if (!roundNumber) {
      setPredictions([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      let query = supabase
        .from('predictions')
        .select(
          `
          *,
          matches (
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
        )
        .eq('user_id', user.id)
        .eq('matches.round_number', roundNumber)

      if (tournamentId) {
        query = query.eq('matches.tournament_id', tournamentId)
      }

      const { data, error } = await query

      if (error) throw error
      setPredictions(data)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const createPrediction = async (
    matchId,
    homePrediction,
    awayPrediction,
    qualifierPredictionId = null
  ) => {
    if (!user) return { data: null, error: 'No autenticado' }

    try {
      // Verificar si el partido aún permite predicciones
      const { data: match } = await supabase
        .from('matches')
        .select('match_date')
        .eq('id', matchId)
        .single()

      if (match) {
        const matchDate = new Date(match.match_date)
        const cutoffTime = new Date(matchDate.getTime() - PREDICTION_CUTOFF_MINUTES * 60 * 1000) // minutos antes configurables

        if (new Date() >= cutoffTime) {
          return { data: null, error: 'Ya no se pueden cargar predicciones para este partido' }
        }
      }

      const { data, error } = await supabase
        .from('predictions')
        .insert([
          {
            user_id: user.id,
            match_id: matchId,
            home_prediction: homePrediction,
            away_prediction: awayPrediction,
            qualifier_prediction_id: qualifierPredictionId,
          },
        ])
        .select()

      if (error) throw error

      // Actualizar estado local en lugar de refetch completo
      if (data && data[0]) {
        setPredictions(prev => [...prev, data[0]])
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const updatePrediction = async (
    predictionId,
    homePrediction,
    awayPrediction,
    qualifierPredictionId = null
  ) => {
    if (!user) return { data: null, error: 'No autenticado' }

    try {
      const { data, error } = await supabase
        .from('predictions')
        .update({
          home_prediction: homePrediction,
          away_prediction: awayPrediction,
          qualifier_prediction_id: qualifierPredictionId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', predictionId)
        .eq('user_id', user.id)
        .select()

      if (error) throw error

      // Actualizar estado local en lugar de refetch completo
      if (data && data[0]) {
        setPredictions(prev => prev.map(p => (p.id === predictionId ? data[0] : p)))
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Nueva función para operaciones batch (mucho más eficiente)
  const batchUpsertPredictions = async predictionsData => {
    if (!user) return { data: null, error: 'No autenticado' }

    try {
      const now = new Date().toISOString()
      const predictions = predictionsData.map(
        ({ matchId, homePrediction, awayPrediction, qualifierPredictionId = null }) => ({
          user_id: user.id,
          match_id: matchId,
          home_prediction: homePrediction,
          away_prediction: awayPrediction,
          qualifier_prediction_id: qualifierPredictionId,
          updated_at: now,
        })
      )

      // Upsert: inserta si no existe, actualiza si existe
      const { data, error } = await supabase
        .from('predictions')
        .upsert(predictions, {
          onConflict: 'user_id,match_id',
          ignoreDuplicates: false,
        })
        .select()

      if (error) throw error

      // Actualizar estado local eficientemente
      if (data) {
        setPredictions(prev => {
          const updated = [...prev]
          data.forEach(newPred => {
            const index = updated.findIndex(p => p.match_id === newPred.match_id)
            if (index >= 0) {
              updated[index] = newPred
            } else {
              updated.push(newPred)
            }
          })
          return updated
        })
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const getUserPredictionForMatch = matchId => predictions.find(p => p.match_id === matchId)

  return {
    predictions,
    loading,
    error,
    fetchPredictions,
    createPrediction,
    updatePrediction,
    batchUpsertPredictions,
    getUserPredictionForMatch,
  }
}
