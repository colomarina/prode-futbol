import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/queryKeys'
import { isHiddenPlayer } from '../constants/hiddenPlayers'
import { buildTournamentStats, emptyStats, normalizeStats } from '../utils/stats'
import type { TournamentStats } from '../utils/stats'
import type { Uuid } from '../types/domain'

/**
 * Trae todo lo necesario para las estadísticas del torneo.
 *
 * `round_scores` no depende de los partidos —le alcanza con el torneo—, así que
 * corre en paralelo con ellos. Solo los pronósticos tienen que esperar, porque
 * necesitan los ids de los partidos. Antes eran tres consultas encadenadas.
 *
 * Los selects traen **exactamente** lo que declara `StatsMatch` / `StatsPrediction`
 * en `utils/stats/types.ts`: si acá se saca una columna, los cálculos no compilan.
 */
const fetchTournamentStats = async (userId: Uuid, tournamentId: Uuid): Promise<TournamentStats> => {
  const [matchesResult, roundScoresResult] = await Promise.all([
    supabase
      .from('matches')
      .select(
        `
          id,
          round_number,
          match_date,
          home_score,
          away_score,
          is_finished,
          home_team:teams!matches_home_team_id_fkey(id, name),
          away_team:teams!matches_away_team_id_fkey(id, name)
        `
      )
      .eq('tournament_id', tournamentId),
    // El perfil embebido se usa solo para descartar jugadores ocultos: sin eso,
    // la posición y el total de participantes no coinciden con los de la tabla.
    supabase
      .from('round_scores')
      .select('user_id, round_number, total_points, profiles (username, full_name)')
      .eq('tournament_id', tournamentId),
  ])

  if (matchesResult.error) throw matchesResult.error
  if (roundScoresResult.error) throw roundScoresResult.error

  const tournamentMatches = matchesResult.data || []
  const matchIds = tournamentMatches.map(match => match.id)

  if (matchIds.length === 0) return emptyStats

  const { data: predictionsData, error: predictionsError } = await supabase
    .from('predictions')
    .select('match_id, home_prediction, away_prediction, points')
    .eq('user_id', userId)
    .in('match_id', matchIds)

  if (predictionsError) throw predictionsError

  // Al usuario propio nunca se lo descarta, aunque esté en la lista de ocultos:
  // si no, su propia página se queda sin posición.
  const visibleRoundScores = (roundScoresResult.data || []).filter(
    score => String(score.user_id) === String(userId) || !isHiddenPlayer(score.profiles)
  )

  return buildTournamentStats(tournamentMatches, predictionsData || [], visibleRoundScores, userId)
}

export const usePersonalStats = (userId: Uuid | null, tournamentId: Uuid | null = null) => {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: queryKeys.personalStats(tournamentId, userId),
    enabled: Boolean(userId),
    queryFn: async (): Promise<TournamentStats> => {
      if (tournamentId) return fetchTournamentStats(userId, tournamentId)

      const { data: rpcData, error: rpcError } = await supabase.rpc('get_personal_stats')

      if (rpcError) throw rpcError
      // La RPC devuelve `Json`: no hay forma de que el esquema generado diga más que
      // eso, así que `normalizeStats` es lo único que garantiza la forma. De ahí que
      // sea el único lugar con un cast en toda la cadena de estadísticas.
      return normalizeStats((rpcData ?? {}) as Partial<TournamentStats>)
    },
  })

  return {
    stats: userId ? (data ?? null) : emptyStats,
    loading: Boolean(userId) && isPending,
    // El mensaje se mantiene genérico: el error crudo de Postgres no le dice
    // nada al usuario.
    error: error ? 'No se pudieron cargar las estadísticas personales' : null,
    // Para que la pantalla pueda ofrecer "Reintentar" y no solo el texto del error.
    // Se llama `fetchStats` y no `refetch` para seguir el nombre que ya usan
    // `useLeaderboard` (`fetchLeaderboard`) y `usePlayoffs` (`fetchPlayoffs`).
    fetchStats: refetch,
  }
}
