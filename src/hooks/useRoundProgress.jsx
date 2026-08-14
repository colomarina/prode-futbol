import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/queryKeys'
import { filterHiddenPlayers } from '../constants/hiddenPlayers'

/** Referencia estable: `data ?? []` crea un array nuevo en cada render. */
const EMPTY_PROGRESS = []

/**
 * Las dos variantes con scope de torneo, en orden de preferencia.
 *
 * Se prueban en cadena porque no todas las bases tienen la `_v2`. Las dos
 * filtran por torneo, así que la cadena es segura: lo que **no** se hace es caer
 * a `get_round_predictions_summary`, que no filtra. Los `round_number` se
 * repiten entre torneos, así que esa variante le mostraba al admin el progreso
 * de los jugadores de otro torneo como si fuera de este.
 */
export const SCOPED_RPC_NAMES = [
  'get_round_predictions_summary_by_tournament_v2',
  'get_round_predictions_summary_by_tournament',
]

const fetchScopedProgress = async (tournamentId, roundNumber) => {
  let lastError = null

  for (const rpcName of SCOPED_RPC_NAMES) {
    const attempt = await supabase.rpc(rpcName, {
      p_tournament_id: tournamentId,
      p_round_num: roundNumber,
    })

    // Se corta por la ausencia de error y no por la truthiness de `data`: una
    // fecha sin jugadores devuelve `[]`, que es una respuesta válida y tiene que
    // cortar la cadena en vez de reintentar con la variante siguiente.
    if (!attempt.error) return attempt.data || []

    lastError = attempt.error
  }

  throw lastError || new Error('No se pudo consultar el progreso de la fecha')
}

const toPlayerProgress = (rows, roundNumber) =>
  filterHiddenPlayers(
    rows.map(row => ({
      id: row.user_id,
      name: row.user_name,
      totalMatches: row.total_matches,
      predictedCount: row.predicted_count,
      missingMatches: row.missing_matches,
      progress: parseFloat(row.progress),
      roundNumber: row.round_number ?? roundNumber,
    }))
  )

/**
 * Cuánto pronosticó cada jugador en una fecha.
 *
 * Lo consume el panel de fechas del admin. Era la última lectura de Supabase que
 * quedaba dentro de un componente (`RoundManager` importaba el cliente directo) y
 * el último `useEffect` de fetching de la app.
 *
 * Sin `roundNumber` la query queda deshabilitada: no hay fecha activa que
 * consultar.
 *
 * @param {string|null} tournamentId
 * @param {number|null} roundNumber
 */
export const useRoundProgress = (tournamentId = null, roundNumber = null) => {
  const enabled = roundNumber !== null && roundNumber !== undefined

  const { data, isPending, error } = useQuery({
    queryKey: queryKeys.roundProgress(tournamentId, roundNumber),
    enabled,
    queryFn: async () => {
      if (tournamentId) return fetchScopedProgress(tournamentId, roundNumber)

      // Sin torneo no hay nada que mezclar, así que acá sí sirve la variante sin
      // scope. En la práctica no se llega: la UI siempre tiene un torneo activo.
      const { data: rows, error: rpcError } = await supabase.rpc('get_round_predictions_summary', {
        round_num: roundNumber,
      })

      if (rpcError) throw rpcError
      return rows || []
    },
  })

  const progress = useMemo(
    () => (data ? toPlayerProgress(data, roundNumber) : EMPTY_PROGRESS),
    [data, roundNumber]
  )

  return {
    progress,
    loading: enabled && isPending,
    error: error || null,
  }
}
