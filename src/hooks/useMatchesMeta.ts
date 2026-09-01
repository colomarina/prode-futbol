import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/queryKeys'
import type { MatchMeta, Uuid } from '../types/domain'

/**
 * Datos mínimos de todos los partidos del torneo, sin los equipos embebidos.
 *
 * Es deliberadamente un superconjunto de lo que necesita cada consumidor:
 * `useRounds` usa `match_date` para derivar la fecha activa, `MatchManager` la
 * usa para saber qué fechas admiten carga de resultados, `RoundManager` usa
 * `is_finished` para el progreso y la tabla de posiciones combina `is_finished`
 * con `is_playoff` para saber qué fechas mostrar. Antes cada uno hacía su propia
 * query con su propio select; con una sola key compartida, la consulta se hace
 * una vez y el resto la lee del cache.
 *
 * Sin torneo la consulta no se dispara: los `round_number` se repiten entre
 * torneos, así que traer todos los partidos no sirve para nada y contradice el
 * scope por torneo. Por eso `loading` combina `isPending` con la misma
 * condición: con la query deshabilitada, `isPending` no baja nunca.
 *
 * El `Promise<MatchMeta[]>` del `queryFn` no es decorativo: es lo que verifica que
 * el select y el tipo `MatchMeta` de `domain.ts` no se desincronicen. Si alguien
 * agrega una columna a uno y no al otro, no compila.
 */
export const useMatchesMeta = (tournamentId: Uuid | null = null) => {
  const enabled = Boolean(tournamentId)

  const { data, isPending, error, refetch } = useQuery({
    queryKey: queryKeys.matchesMeta(tournamentId),
    enabled,
    queryFn: async (): Promise<MatchMeta[]> => {
      const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select('id, round_number, match_date, is_finished, is_playoff')
        .eq('tournament_id', tournamentId)
        .order('round_number', { ascending: true })

      if (matchesError) throw matchesError
      return matches || []
    },
  })

  // Referencia estable: sus consumidores la usan como dependencia de useMemo y
  // de efectos. Ver el comentario de `useMatches`.
  const matchesMeta = useMemo(() => data ?? [], [data])

  return {
    matchesMeta,
    loading: isPending && enabled,
    error: error ? error.message : null,
    refetch,
  }
}
