import { useCallback, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/queryKeys'
import { getNextActiveRoundNumber } from '../utils/matchTiming'
import { useMatchesMeta } from './useMatchesMeta'

/**
 * Fechas del torneo y cuál es la activa.
 *
 * Este hook se instancia en 9 lugares distintos. Antes cada instancia disparaba
 * dos queries encadenadas (rondas y después partidos), o sea 18 consultas por
 * pantalla; ahora las dos comparten cache y corren en paralelo, porque no
 * dependen una de la otra.
 *
 * @param {string|null} tournamentId
 */
export const useRounds = (tournamentId = null) => {
  const queryClient = useQueryClient()

  const {
    data: rounds,
    isPending: roundsLoading,
    error: roundsError,
    refetch: refetchRounds,
  } = useQuery({
    queryKey: queryKeys.rounds(tournamentId),
    queryFn: async () => {
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

  // La fecha activa se deriva de los match_date, no de rounds.status.
  const activeRound = useMemo(() => {
    const activeRoundNumber = getNextActiveRoundNumber(roundsList, matchesMeta)
    return roundsList.find(round => round.round_number === activeRoundNumber) || null
  }, [roundsList, matchesMeta])

  const invalidateRounds = useCallback(
    () => queryClient.invalidateQueries({ queryKey: queryKeys.rounds(tournamentId) }),
    [queryClient, tournamentId]
  )

  const updateStatusMutation = useMutation({
    mutationFn: async ({ roundNumber, status }) => {
      let query = supabase
        .from('rounds')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('round_number', roundNumber)

      if (tournamentId) {
        query = query.eq('tournament_id', tournamentId)
      }

      const { error } = await query
      if (error) throw error
    },
    onSuccess: invalidateRounds,
  })

  /**
   * Se conserva el contrato `{ error }` en vez de propagar la excepción: los
   * componentes que llaman a esto ya manejan la respuesta así y muestran su
   * propio toast.
   */
  const runStatusMutation = useCallback(
    async (roundNumber, status) => {
      try {
        await updateStatusMutation.mutateAsync({ roundNumber, status })
        return { error: null }
      } catch (error) {
        return { error }
      }
    },
    [updateStatusMutation]
  )

  const updateRoundStatus = useCallback(
    (roundNumber, status) => runStatusMutation(roundNumber, status),
    [runStatusMutation]
  )

  const lockRound = useCallback(
    roundNumber => runStatusMutation(roundNumber, 'locked'),
    [runStatusMutation]
  )

  const finishRound = useCallback(
    roundNumber => runStatusMutation(roundNumber, 'finished'),
    [runStatusMutation]
  )

  const openNextRound = useCallback(async () => {
    const pendingRound = roundsList.find(round => round.status === 'pending')

    if (!pendingRound) {
      return { error: new Error('No hay fechas pendientes para abrir') }
    }

    return runStatusMutation(pendingRound.round_number, 'open')
  }, [roundsList, runStatusMutation])

  const isRoundOpen = useCallback(
    roundNumber => roundsList.find(round => round.round_number === roundNumber)?.status === 'open',
    [roundsList]
  )

  const fetchRounds = useCallback(() => {
    refetchRounds()
    refetchMatches()
  }, [refetchRounds, refetchMatches])

  return {
    rounds: roundsList,
    activeRound,
    loading: roundsLoading || matchesLoading,
    error: roundsError ? roundsError.message : matchesError,
    fetchRounds,
    updateRoundStatus,
    openNextRound,
    lockRound,
    finishRound,
    isRoundOpen,
    canPredictRound: isRoundOpen,
  }
}
