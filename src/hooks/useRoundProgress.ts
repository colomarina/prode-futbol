import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/queryKeys'
import { filterHiddenPlayers } from '../constants/hiddenPlayers'
import type { Fn, Uuid } from '../types/domain'

/** Cuánto pronosticó un jugador en una fecha, ya normalizado para la UI. */
export interface PlayerProgress {
  id: Uuid
  name: string
  totalMatches: number
  predictedCount: number
  missingMatches: number[]
  progress: number
  roundNumber: number
}

/** Referencia estable: `data ?? []` crea un array nuevo en cada render. */
const EMPTY_PROGRESS: PlayerProgress[] = []

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
] as const

/**
 * Lo que devuelven las dos RPC, **derivado del esquema generado** en vez de escrito
 * a mano: las dos declaran la misma forma.
 *
 * Escribirlo a mano ya salió mal una vez: se había tipado `missing_matches` como
 * un número cuando es `number[]` —los números de los partidos que faltan, que es
 * lo que `PlayerProgressRow` lista— y el compilador lo marcó.
 */
type ProgressRow = Fn<'get_round_predictions_summary_by_tournament_v2'>['Returns'][number]

const fetchScopedProgress = async (
  tournamentId: Uuid,
  roundNumber: number
): Promise<ProgressRow[]> => {
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

const toPlayerProgress = (rows: ProgressRow[], roundNumber: number): PlayerProgress[] =>
  filterHiddenPlayers(
    rows.map(row => ({
      id: row.user_id,
      name: row.user_name,
      totalMatches: row.total_matches,
      predictedCount: row.predicted_count,
      missingMatches: row.missing_matches,
      // El esquema dice `number`, pero PostgREST serializa `numeric` como string
      // según la versión: el `parseFloat` es la defensa que ya estaba y se queda.
      progress: parseFloat(String(row.progress)),
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
 * **Sin torneo tampoco se consulta.** Antes esta rama llamaba a
 * `get_round_predictions_summary` (la variante sin scope), y el esquema generado
 * mostró que **esa función no existe en la base**: la llamada habría fallado con un
 * 404 de PostgREST. El comentario original ya decía que en la práctica no se llega
 * —la UI siempre tiene un torneo activo—, así que ahora falla explícito en vez de
 * pedirle a la base algo que no está.
 */
export const useRoundProgress = (
  tournamentId: Uuid | null = null,
  roundNumber: number | null = null
) => {
  const enabled = roundNumber !== null && roundNumber !== undefined

  const { data, isPending, error } = useQuery({
    queryKey: queryKeys.roundProgress(tournamentId, roundNumber),
    enabled,
    queryFn: async (): Promise<ProgressRow[]> => {
      if (!tournamentId) {
        throw new Error('El progreso de la fecha necesita un torneo: no hay variante sin scope')
      }

      return fetchScopedProgress(tournamentId, roundNumber)
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
