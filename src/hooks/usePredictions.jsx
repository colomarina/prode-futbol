import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export const usePredictions = (roundNumber = null) => {
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchPredictions()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, roundNumber])

  const fetchPredictions = async () => {
    if (!user) return

    try {
      setLoading(true)
      let query = supabase
        .from('predictions')
        .select(`
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
            round_number
          )
        `)
        .eq('user_id', user.id)

      if (roundNumber) {
        query = query.eq('matches.round_number', roundNumber)
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

  const createPrediction = async (matchId, homePrediction, awayPrediction) => {
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
        const cutoffTime = new Date(matchDate.getTime() - 60 * 60 * 1000) // 1 hora antes

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
          },
        ])
        .select()

      if (error) throw error
      await fetchPredictions()
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const updatePrediction = async (predictionId, homePrediction, awayPrediction) => {
    if (!user) return { data: null, error: 'No autenticado' }

    try {
      const { data, error } = await supabase
        .from('predictions')
        .update({
          home_prediction: homePrediction,
          away_prediction: awayPrediction,
          updated_at: new Date().toISOString(),
        })
        .eq('id', predictionId)
        .eq('user_id', user.id)
        .select()

      if (error) throw error
      await fetchPredictions()
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const getUserPredictionForMatch = (matchId) => {
    return predictions.find(p => p.match_id === matchId)
  }

  return {
    predictions,
    loading,
    error,
    fetchPredictions,
    createPrediction,
    updatePrediction,
    getUserPredictionForMatch,
  }
}
