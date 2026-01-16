import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const useLeaderboard = (roundNumber = null) => {
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchLeaderboard()
  }, [roundNumber])

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)

      if (roundNumber) {
        // Tabla de posiciones por fecha específica
        const { data: roundScoresData, error: roundError } = await supabase
          .from('round_scores')
          .select(`
            user_id,
            total_points,
            profiles (
              id,
              username,
              full_name,
              avatar_url
            )
          `)
          .eq('round_number', roundNumber)
          .order('total_points', { ascending: false })

        if (roundError) throw roundError

        // Transformar los datos al formato esperado
        const formattedData = roundScoresData.map(item => ({
          id: item.profiles.id,
          username: item.profiles.username,
          full_name: item.profiles.full_name,
          avatar_url: item.profiles.avatar_url,
          round_number: roundNumber,
          total_points: item.total_points
        }))

        setLeaderboard(formattedData)
      } else {
        // Tabla de posiciones general
        // Primero obtenemos todos los round_scores
        const { data: allScores, error: scoresError } = await supabase
          .from('round_scores')
          .select(`
            user_id,
            total_points,
            round_number
          `)

        if (scoresError) throw scoresError

        // Agrupar por usuario y sumar puntos
        const userTotals = {}
        allScores.forEach(score => {
          if (!userTotals[score.user_id]) {
            userTotals[score.user_id] = {
              total_points: 0,
              rounds_played: new Set()
            }
          }
          userTotals[score.user_id].total_points += score.total_points
          userTotals[score.user_id].rounds_played.add(score.round_number)
        })

        // Obtener información de perfiles
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')

        if (profilesError) throw profilesError

        // Combinar datos
        const formattedData = profiles.map(profile => ({
          ...profile,
          total_points: userTotals[profile.id]?.total_points || 0,
          rounds_played: userTotals[profile.id]?.rounds_played.size || 0
        }))

        // Ordenar por puntos
        formattedData.sort((a, b) => {
          if (b.total_points !== a.total_points) {
            return b.total_points - a.total_points
          }
          return a.username.localeCompare(b.username)
        })

        setLeaderboard(formattedData)
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return {
    leaderboard,
    loading,
    error,
    fetchLeaderboard,
  }
}
