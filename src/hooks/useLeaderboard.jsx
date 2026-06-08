import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { filterHiddenPlayers } from '../constants/hiddenPlayers'

const buildLeaderboardFromRoundScores = roundScoresData => {
  const totalsByUser = new Map()

  ;(roundScoresData || []).forEach(item => {
    if (!item?.profiles?.id) return

    const userId = item.profiles.id
    const previous = totalsByUser.get(userId)

    if (previous) {
      previous.total_points += item.total_points || 0
      previous.rounds_played += 1
    } else {
      totalsByUser.set(userId, {
        id: item.profiles.id,
        username: item.profiles.username,
        full_name: item.profiles.full_name,
        avatar_url: item.profiles.avatar_url,
        total_points: item.total_points || 0,
        rounds_played: 1,
      })
    }
  })

  return Array.from(totalsByUser.values()).sort((a, b) => b.total_points - a.total_points)
}

const fetchTournamentRoundNumbers = async tournamentId => {
  if (!tournamentId) return null

  const { data, error } = await supabase
    .from('rounds')
    .select('round_number')
    .eq('tournament_id', tournamentId)

  if (error) throw error

  const uniqueRoundNumbers = [...new Set((data || []).map(round => round.round_number))]
  return uniqueRoundNumbers
}

export const useLeaderboard = (roundNumber = null, tournamentId = null, includeWorldCupBonus = false) => {
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const tournamentRoundNumbers = await fetchTournamentRoundNumbers(tournamentId)

      if (tournamentId && (!tournamentRoundNumbers || tournamentRoundNumbers.length === 0)) {
        setLeaderboard([])
        return
      }

      const fetchRoundScoresByRounds = async (roundNumbers, includeRoundInSelect = false) => {
        if (!roundNumbers?.length) return []

        const baseSelect = includeRoundInSelect
          ? `
            user_id,
            total_points,
            round_number,
            profiles (
              id,
              username,
              full_name,
              avatar_url
            )
          `
          : `
            user_id,
            total_points,
            profiles (
              id,
              username,
              full_name,
              avatar_url
            )
          `

        if (tournamentId) {
          const scopedAttempt = await supabase
            .from('round_scores')
            .select(baseSelect)
            .eq('tournament_id', tournamentId)
            .in('round_number', roundNumbers)

          if (!scopedAttempt.error) {
            return scopedAttempt.data || []
          }
        }

        const legacyAttempt = await supabase
          .from('round_scores')
          .select(baseSelect)
          .in('round_number', roundNumbers)

        if (legacyAttempt.error) throw legacyAttempt.error
        return legacyAttempt.data || []
      }

      if (roundNumber === 'playoffs') {
        let playoffRounds = [17, 18, 19, 20]

        if (tournamentId) {
          const { data: playoffMatches, error: playoffMatchesError } = await supabase
            .from('matches')
            .select('round_number')
            .eq('is_playoff', true)
            .eq('tournament_id', tournamentId)

          if (playoffMatchesError) throw playoffMatchesError

          playoffRounds = [...new Set((playoffMatches || []).map(match => match.round_number))]
        }

        if (!playoffRounds.length) {
          setLeaderboard([])
          return
        }

        const roundScoresData = await fetchRoundScoresByRounds(playoffRounds)

        const formattedData = buildLeaderboardFromRoundScores(roundScoresData).map(item => ({
          ...item,
          round_number: 'playoffs',
        }))

        setLeaderboard(filterHiddenPlayers(formattedData))
      } else if (roundNumber) {
        if (tournamentId && !tournamentRoundNumbers.includes(roundNumber)) {
          setLeaderboard([])
          return
        }

        // Tabla de posiciones por fecha específica
        const roundScoresData = await fetchRoundScoresByRounds([roundNumber])

        // Transformar los datos al formato esperado
        const formattedData = roundScoresData.map(item => ({
          id: item.profiles.id,
          username: item.profiles.username,
          full_name: item.profiles.full_name,
          avatar_url: item.profiles.avatar_url,
          round_number: roundNumber,
          total_points: item.total_points,
        }))

        setLeaderboard(filterHiddenPlayers(formattedData))
      } else {
        // Tabla de posiciones general
        if (!tournamentId) {
          // Sin torneo activo, usar vista optimizada original
          const { data, error: viewError } = await supabase.from('general_leaderboard').select('*')

          if (viewError) throw viewError

          setLeaderboard(filterHiddenPlayers(data || []))
          return
        }

        if (includeWorldCupBonus) {
          const { data: bonusLeaderboard, error: bonusError } = await supabase.rpc(
            'get_tournament_leaderboard_with_bonus',
            {
              p_tournament_id: tournamentId,
            }
          )

          if (bonusError) throw bonusError

          setLeaderboard(filterHiddenPlayers(bonusLeaderboard || []))
          return
        }

        const roundScoresData = await fetchRoundScoresByRounds(tournamentRoundNumbers, true)

        setLeaderboard(filterHiddenPlayers(buildLeaderboardFromRoundScores(roundScoresData)))
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }, [roundNumber, tournamentId, includeWorldCupBonus])

  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard])

  return {
    leaderboard,
    loading,
    error,
    fetchLeaderboard,
  }
}
