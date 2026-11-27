import { useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/queryKeys'
import { getNextActiveRoundNumber } from '../utils/matchTiming'
import { useMatchesMeta } from './useMatchesMeta'
import type { Round, Uuid } from '../types/domain'

/**
 * Fechas del torneo y cuál es la activa.
 *
 * Este hook se instancia en 9 lugares distintos. Antes cada instancia disparaba
 * dos queries encadenadas (rondas y después partidos), o sea 18 consultas por
 * pantalla; ahora las dos comparten cache y corren en paralelo, porque no
 * dependen una de la otra.
 */
export const useRounds = (tournamentId: Uuid | null = null) => {
  const {
    data: rounds,
    isPending: roundsLoading,
    error: roundsError,
    refetch: refetchRounds,
  } = useQuery({
    queryKey: queryKeys.rounds(tournamentId),
    queryFn: async (): Promise<Round[]> => {
      let query = supabase.from('rounds').select('*')

      if (tournamentId) {
        query = query.eq('tournament_id', tournamentId)
      }

      const { data, error } = await query.order('round_number', { ascending: true })

      if (error) throw error
      return data || []
    },
  })

  const {
    matchesMeta,
    loading: matchesLoading,
    error: matchesError,
    refetch: refetchMatches,
  } = useMatchesMeta(tournamentId)

  const roundsList = useMemo(() => rounds ?? [], [rounds])

  /**
   * La fecha activa se deriva de los match_date, no de rounds.status.
   *
   * Mientras los partidos no llegaron hay que devolver null, no calcular con una
   * lista vacia: sin partidos `getNextActiveRoundNumber` cae a su ultimo fallback
   * y devuelve el round_number mas alto del torneo. Como ahora las dos consultas
   * corren en paralelo, `rounds` puede resolver primero, y los consumidores
   * tomaban esa fecha equivocada como definitiva: `PredictionForm` pedia los
   * partidos y los pronosticos de la ultima fecha del torneo y recien despues
   * saltaba a la correcta. La version encadenada no tenia el problema porque
   * calculaba la fecha activa con las dos respuestas ya en la mano.
   */
  const activeRound = useMemo((): Round | null => {
    if (matchesLoading) return null

    const activeRoundNumber = getNextActiveRoundNumber(roundsList, matchesMeta)
    return roundsList.find(round => round.round_number === activeRoundNumber) || null
  }, [roundsList, matchesMeta, matchesLoading])

  const fetchRounds = useCallback((): void => {
    refetchRounds()
    refetchMatches()
  }, [refetchRounds, refetchMatches])

  return {
    rounds: roundsList,
    activeRound,
    loading: roundsLoading || matchesLoading,
    error: roundsError ? roundsError.message : matchesError,
    fetchRounds,
  }
}
