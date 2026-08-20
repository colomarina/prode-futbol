import { useCallback, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/queryKeys'
import { filterHiddenPlayers } from '../constants/hiddenPlayers'
import { compareByPoints } from '../utils/ranking'
import { WORLD_CUP_STANDALONE_ROUNDS } from '../utils/leaderboardRounds'
import type { Profile, Uuid } from '../types/domain'

/**
 * Una fila de la tabla de posiciones.
 *
 * Sale de **tres fuentes distintas** que la UI trata igual: la agregación de
 * `round_scores` que se hace acá, la vista `general_leaderboard`, y la RPC
 * `get_tournament_leaderboard_with_bonus`. Este tipo es el mínimo común de las
 * tres, y escribirlo sirvió para ver en qué se diferencian:
 *
 * - `bonus_points` **solo** viene de la RPC, o sea solo en la general del Mundial.
 * - `round_number` solo aparece en la tabla de una fecha y en la de playoffs.
 * - `id` puede ser null y eso es real: en la vista `general_leaderboard` todas las
 *   columnas son nullables. La agregación de acá descarta las filas sin
 *   `profiles.id`, así que por ese camino nunca es null. La rama de la vista es la
 *   que `App.jsx` prácticamente no deja alcanzar y que el plan propone borrar en la
 *   fase 9; cuando se prenda `strict` conviene resolver las dos cosas juntas.
 */
export interface LeaderboardEntry {
  id: Uuid | null
  username: string | null
  full_name: string | null
  avatar_url: string | null
  total_points: number
  rounds_played: number
  bonus_points?: number
  round_number?: number | 'playoffs'
}

/** El perfil embebido en `round_scores`, que es de donde salen nombre y avatar. */
type PerfilEmbebido = Pick<Profile, 'id' | 'username' | 'full_name' | 'avatar_url'>

/** Una fila de `round_scores` tal como la piden los selects de abajo. */
interface RoundScoreRow {
  user_id: Uuid
  total_points: number | null
  round_number?: number
  profiles: PerfilEmbebido | null
}

const buildLeaderboardFromRoundScores = (
  roundScoresData: RoundScoreRow[] | null | undefined
): LeaderboardEntry[] => {
  const totalsByUser = new Map<Uuid, LeaderboardEntry>()

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

const fetchTournamentRoundNumbers = async (tournamentId: Uuid | null): Promise<number[] | null> => {
  if (!tournamentId) return null

  const { data, error } = await supabase
    .from('rounds')
    .select('round_number')
    .eq('tournament_id', tournamentId)

  if (error) throw error

  return [...new Set((data || []).map(round => round.round_number))]
}

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
 *
 * El select se arma con una condición, así que supabase-js no puede inferir la
 * forma —para eso el string tiene que ser literal— y el tipo de acá es una
 * declaración y no una verificación. Es el único lugar de la capa de datos donde
 * pasa: el resto de los hooks tienen selects literales y ahí el tipo sí se chequea
 * contra el esquema.
 */
const fetchRoundScoresByRounds = async (
  tournamentId: Uuid | null,
  roundNumbers: number[] | null | undefined,
  includeRoundInSelect: boolean
): Promise<RoundScoreRow[]> => {
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
  return (data as unknown as RoundScoreRow[]) || []
}

/**
 * Arma la tabla de posiciones. Es una función suelta y no un hook para que la
 * lógica de ramas quede testeable y `useQuery` solo se ocupe del cacheo.
 *
 * `isWorldCupTournament` cambia dos cosas: la general sale de la RPC con bonus, y
 * 16avos y octavos quedan afuera de la tabla agregada de playoffs porque tienen
 * tabla propia.
 */
export const fetchLeaderboardData = async ({
  roundNumber,
  tournamentId,
  isWorldCupTournament,
}: {
  roundNumber?: number | 'playoffs' | null
  tournamentId?: Uuid | null
  isWorldCupTournament?: boolean
}): Promise<LeaderboardEntry[]> => {
  const tournamentRoundNumbers = await fetchTournamentRoundNumbers(tournamentId ?? null)

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

    if (isWorldCupTournament) {
      playoffRounds = playoffRounds.filter(round => !WORLD_CUP_STANDALONE_ROUNDS.has(round))
    }

    if (!playoffRounds.length) return []

    const roundScoresData = await fetchRoundScoresByRounds(tournamentId, playoffRounds, false)

    return filterHiddenPlayers(
      buildLeaderboardFromRoundScores(roundScoresData).map(item => ({
        ...item,
        round_number: 'playoffs' as const,
      }))
    )
  }

  if (normalizedRoundNumber) {
    const roundToFetch = Number(normalizedRoundNumber)

    if (tournamentId && !tournamentRoundNumbers.includes(roundToFetch)) {
      return []
    }

    const roundScoresData = await fetchRoundScoresByRounds(tournamentId, [roundToFetch], false)

    return filterHiddenPlayers(
      buildLeaderboardFromRoundScores(roundScoresData).map(item => ({
        ...item,
        round_number: roundToFetch,
      }))
    )
  }

  // Tabla general
  if (!tournamentId) {
    const { data, error } = await supabase.from('general_leaderboard').select('*')

    if (error) throw error
    return filterHiddenPlayers(data || [])
  }

  if (isWorldCupTournament) {
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
  roundNumber: number | 'playoffs' | null = null,
  tournamentId: Uuid | null = null,
  isWorldCupTournament = false
) => {
  const queryClient = useQueryClient()

  const { data, isPending, error } = useQuery({
    queryKey: queryKeys.leaderboard(tournamentId, roundNumber, isWorldCupTournament),
    queryFn: () => fetchLeaderboardData({ roundNumber, tournamentId, isWorldCupTournament }),
  })

  const fetchLeaderboard = useCallback(
    () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.leaderboard(tournamentId, roundNumber, isWorldCupTournament),
      }),
    [queryClient, tournamentId, roundNumber, isWorldCupTournament]
  )

  // Referencia estable, como en el resto de los hooks de datos.
  const leaderboard = useMemo(() => data ?? [], [data])

  return {
    leaderboard,
    loading: isPending,
    error: error ? error.message : null,
    fetchLeaderboard,
  }
}
