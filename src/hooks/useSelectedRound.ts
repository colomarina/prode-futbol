import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Round, Uuid } from '../types/domain'

/**
 * Qué fecha está mirando el usuario, y cuál se elige sola cuando no eligió nada.
 *
 * Son tres reglas que estaban sueltas en `PredictionForm` —dos efectos, un ref y
 * un ordenamiento— y que solo se podían probar renderizando el formulario entero
 * con Supabase mockeado:
 *
 *   1. La selección manual gana. Una vez que el usuario tocó el selector, la
 *      auto-selección no se lo mueve más.
 *   2. Se espera a que las fechas terminen de cargar antes de elegir (ver el
 *      comentario del efecto, que documenta un bug real).
 *   3. Cambiar de torneo borra la selección: los `round_number` se repiten entre
 *      torneos, así que conservarla mostraría la fecha equivocada.
 *
 */
export const useSelectedRound = ({
  tournamentId,
  rounds,
  activeRound,
  loading = false,
}: {
  tournamentId?: Uuid | null
  rounds?: Round[] | null
  activeRound?: Round | null
  loading?: boolean
}) => {
  /**
   * Arranca en null a propósito, incluso si `activeRound` ya vino del cache: la
   * auto-selección de abajo la resuelve igual, y sembrarla acá pedía los partidos
   * de una fecha que el efecto de reset volvía a poner en null en el mismo commit.
   */
  const [selectedRound, setSelectedRound] = useState<number | null>(null)
  const hasManualSelection = useRef(false)

  /** Descendente: la fecha más nueva primero, que es la que el usuario busca. */
  const availableRounds = useMemo(
    () => (rounds || []).slice().sort((a, b) => b.round_number - a.round_number),
    [rounds]
  )

  const selectRound = useCallback((roundNumber: number): void => {
    hasManualSelection.current = true
    setSelectedRound(roundNumber)
  }, [])

  /**
   * Volver a la fecha activa, y volver a seguirla.
   *
   * No es lo mismo que `selectRound(activeRound.round_number)`: además de mover la
   * selección apaga la marca de manual, así que si mientras la pantalla está
   * abierta se abre la fecha siguiente, el usuario la sigue.
   */
  const followActiveRound = useCallback((): void => {
    if (!activeRound) return

    hasManualSelection.current = false
    setSelectedRound(activeRound.round_number)
  }, [activeRound])

  useEffect(() => {
    setSelectedRound(null)
    hasManualSelection.current = false
  }, [tournamentId])

  useEffect(() => {
    // Hay que esperar a que `useRounds` termine: `availableRounds` esta ordenado
    // descendente, asi que su primer elemento es la fecha mas alta del torneo. Si
    // las fechas ya llegaron pero los partidos no, `activeRound` todavia es null y
    // este fallback elegia esa ultima fecha, pedia sus partidos y sus pronosticos,
    // y recien despues saltaba a la correcta. El fallback sigue existiendo para el
    // torneo que ya se jugo entero, donde no hay ninguna fecha activa.
    if (loading) return
    if (availableRounds.length === 0) return

    if (activeRound && !hasManualSelection.current) {
      if (selectedRound !== activeRound.round_number) {
        setSelectedRound(activeRound.round_number)
      }
      return
    }

    if (!selectedRound) {
      setSelectedRound(availableRounds[0].round_number)
    }
  }, [activeRound, availableRounds, selectedRound, loading])

  return { selectedRound, availableRounds, selectRound, followActiveRound }
}
