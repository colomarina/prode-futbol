import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/queryKeys'
import { filterHiddenPlayers } from '../constants/hiddenPlayers'
import { compareByPoints } from '../utils/ranking'

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

  return Array.from(totalsByUser.values()).sort(
    compareByPoints(
      entry => entry.total_points,
      entry => entry.id
    )
  )
}

const fetchTournamentRoundNumbers = async tournamentId => {
  if (!tournamentId) return null

  const { data, error } = await supabase
    .from('rounds')
    .select('round_number')
    .eq('tournament_id', tournamentId)

  if (error) throw error

  return [...new Set((data || []).map(round => round.round_number))]
}

const STANDALONE_TABLE_ROUNDS = new Set([4, 5])

const PROFILE_FIELDS = `
  profiles (
    id,
    username,
    full_name,
    avatar_url
  )
`

/**
 * Puntajes por fecha, siempre con scope de torneo.
 *
 * Los `round_number` se repiten entre torneos, así que una consulta sin
 * `tournament_id` no falla: suma los puntos de todos. Nunca agregar un fallback
 * que quite ese filtro.
 */
const fetchRoundScoresByRounds = async (tournamentId, roundNumbers, includeRoundInSelect) => {
  if (!roundNumbers?.length) return []

  const baseSelect = includeRoundInSelect
    ? `user_id, total_points, round_number, ${PROFILE_FIELDS}`
    : `user_id, total_points, ${PROFILE_FIELDS}`

  let query = supabase.from('round_scores').select(baseSelect).in('round_number', roundNumbers)

  if (tournamentId) {
    query = query.eq('tournament_id', tournamentId)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

/**
 * Arma la tabla de posiciones. Es una función suelta y no un hook para que la
 * lógica de ramas quede testeable y `useQuery` solo se ocupe del cacheo.
 */
export const fetchLeaderboardData = async ({ roundNumber, tournamentId, includeWorldCupBonus }) => {
  const tournamentRoundNumbers = await fetchTournamentRoundNumbers(tournamentId)

  const normalizedRoundNumber =
    roundNumber !== null && roundNumber !== undefined && roundNumber !== 'playoffs'
      ? Number(roundNumber)
      : roundNumber

  if (tournamentId && (!tournamentRoundNumbers || tournamentRoundNumbers.length === 0)) {
    return []
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

    playoffRounds = playoffRounds.filter(round => !STANDALONE_TABLE_ROUNDS.has(round))

    if (!playoffRounds.length) return []

    const roundScoresData = await fetchRoundScoresByRounds(tournamentId, playoffRounds, false)

    return filterHiddenPlayers(
      buildLeaderboardFromRoundScores(roundScoresData).map(item => ({
        ...item,
        round_number: 'playoffs',
      }))
    )
  }

  if (normalizedRoundNumber) {
    if (tournamentId && !tournamentRoundNumbers.includes(normalizedRoundNumber)) {
      return []
    }

    const roundScoresData = await fetchRoundScoresByRounds(
      tournamentId,
      [normalizedRoundNumber],
      false
    )

    return filterHiddenPlayers(
      buildLeaderboardFromRoundScores(roundScoresData).map(item => ({
        ...item,
        round_number: normalizedRoundNumber,
      }))
    )
  }

  // Tabla general
  if (!tournamentId) {
    const { data, error } = await supabase.from('general_leaderboard').select('*')

    if (error) throw error
    return filterHiddenPlayers(data || [])
  }

  if (includeWorldCupBonus) {
    const { data, error } = await supabase.rpc('get_tournament_leaderboard_with_bonus', {
      p_tournament_id: tournamentId,
    })

    if (error) throw error
    return filterHiddenPlayers(data || [])
  }

  const roundScoresData = await fetchRoundScoresByRounds(tournamentId, tournamentRoundNumbers, true)

  return filterHiddenPlayers(buildLeaderboardFromRoundScores(roundScoresData))
}

export const useLeaderboard = (
  roundNumber = null,
  tournamentId = null,
  includeWorldCupBonus = false
) => {
  const queryClient = useQueryClient()

  const { data, isPending, error } = useQuery({
    queryKey: queryKeys.leaderboard(tournamentId, roundNumber, includeWorldCupBonus),
    queryFn: () => fetchLeaderboardData({ roundNumber, tournamentId, includeWorldCupBonus }),
  })

  const fetchLeaderboard = useCallback(
    () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.leaderboard(tournamentId, roundNumber, includeWorldCupBonus),
      }),
    [queryClient, tournamentId, roundNumber, includeWorldCupBonus]
  )

  return {
    leaderboard: data ?? [],
    loading: isPending,
    error: error ? error.message : null,
    fetchLeaderboard,
  }
}
