import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/queryKeys'

/**
 * Datos mínimos de todos los partidos del torneo, sin los equipos embebidos.
 *
 * Es deliberadamente un superconjunto de lo que necesita cada consumidor:
 * `useRounds` usa `match_date` para derivar la fecha activa, `MatchManager` la
 * usa para saber qué fechas admiten carga de resultados y `RoundManager` usa
 * `is_finished` para el progreso. Antes cada uno hacía su propia query con su
 * propio select; con una sola key compartida, la consulta se hace una vez y el
 * resto la lee del cache.
 *
 * @param {string|null} tournamentId
 */
export const useMatchesMeta = (tournamentId = null) => {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: queryKeys.matchesMeta(tournamentId),
    queryFn: async () => {
      let query = supabase.from('matches').select('id, round_number, match_date, is_finished')

      if (tournamentId) {
        query = query.eq('tournament_id', tournamentId)
      }

      const { data: matches, error: matchesError } = await query.order('round_number', {
        ascending: true,
      })

      if (matchesError) throw matchesError
      return matches || []
    },
  })

  return {
    matchesMeta: data ?? [],
    loading: isPending,
    error: error ? error.message : null,
    refetch,
  }
}
