import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRounds } from './useRounds'
import { useMatches } from './useMatches'
import { useMatchesMeta } from './useMatchesMeta'
import { useTournament } from '../contexts/TournamentContext'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/queryKeys'
import { filterHiddenPlayers } from '../constants/hiddenPlayers'
import { hasMatchStarted } from '../utils/matchTiming'

/** Convierte una lista de pronósticos en un mapa por la clave indicada. */
const indexBy = (predictions, key) =>
  Object.fromEntries((predictions || []).map(prediction => [prediction[key], prediction]))

export function useAllPredictions({ initialRound = null, initialUser = '' } = {}) {
  const { activeTournament } = useTournament()
  const tournamentId = activeTournament?.id
  const { rounds, loading: roundsLoading } = useRounds(tournamentId)
  const { matchesMeta } = useMatchesMeta(tournamentId)

  const [selectedRound, setSelectedRound] = useState(initialRound || null)
  const [selectedUser, setSelectedUser] = useState('')
  const [selectedMatchId, setSelectedMatchId] = useState(null)
  const [viewMode, setViewMode] = useState('by-match')

  const { matches, loading: matchesLoading } = useMatches(selectedRound, tournamentId)

  const { data: users } = useQuery({
    queryKey: queryKeys.profiles(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name')
        .order('full_name')

      if (error) throw error
      return filterHiddenPlayers(data || [])
    },
  })

  useEffect(() => {
    if (initialUser && viewMode === 'by-user') setSelectedUser(initialUser)
  }, [initialUser, viewMode])

  useEffect(() => {
    setSelectedMatchId(null)
  }, [selectedRound])

  useEffect(() => {
    if (viewMode === 'by-user') {
      setSelectedMatchId(null)
    } else {
      setSelectedUser('')
    }
  }, [viewMode])

  // Solo se listan las fechas que ya empezaron: antes de eso, mostrar los
  // pronosticos ajenos seria espiar.
  const availableRounds = useMemo(
    () =>
      rounds
        .filter(round =>
          matchesMeta.some(
            match => match.round_number === round.round_number && hasMatchStarted(match.match_date)
          )
        )
        .sort((a, b) => a.round_number - b.round_number),
    [matchesMeta, rounds]
  )

  const selectedUserData = useMemo(
    () => (users ?? []).find(user => user.id === selectedUser),
    [users, selectedUser]
  )

  const selectedMatch = useMemo(
    () => matches.find(match => match.id === selectedMatchId),
    [matches, selectedMatchId]
  )

  const selectedRoundHasStartedMatches = useMemo(
    () => matches.some(match => hasMatchStarted(match.match_date)),
    [matches]
  )

  const matchIds = useMemo(() => matches.map(match => match.id), [matches])

  const roundPredictionsEnabled =
    viewMode === 'by-user' &&
    Boolean(selectedRound) &&
    Boolean(selectedUser) &&
    matchIds.length > 0 &&
    selectedRoundHasStartedMatches

  const roundPredictionsQuery = useQuery({
    queryKey: queryKeys.predictionsOfUserInRound(tournamentId, selectedRound, selectedUser),
    enabled: roundPredictionsEnabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .in('match_id', matchIds)
        .eq('user_id', selectedUser)

      if (error) throw error
      return indexBy(data, 'match_id')
    },
  })

  const matchPredictionsEnabled =
    viewMode === 'by-match' &&
    Boolean(selectedMatchId) &&
    Boolean(selectedMatch) &&
    hasMatchStarted(selectedMatch?.match_date)

  const matchPredictionsQuery = useQuery({
    queryKey: queryKeys.predictionsByMatch(tournamentId, selectedMatchId),
    enabled: matchPredictionsEnabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .eq('match_id', selectedMatchId)

      if (error) throw error
      return indexBy(data, 'user_id')
    },
  })

  return {
    rounds,
    roundsLoading,
    availableRounds,
    matches,
    matchesLoading,
    users: users ?? [],
    selectedUser,
    setSelectedUser,
    selectedUserData,
    selectedRound,
    setSelectedRound,
    selectedMatchId,
    setSelectedMatchId,
    selectedMatch,
    viewMode,
    setViewMode,
    // Sin seleccion no hay nada que mostrar: el mapa vacio es el estado correcto.
    roundPredictions: roundPredictionsEnabled ? (roundPredictionsQuery.data ?? {}) : {},
    matchPredictions: matchPredictionsEnabled ? (matchPredictionsQuery.data ?? {}) : {},
    loading: roundPredictionsEnabled && roundPredictionsQuery.isPending,
    matchLoading: matchPredictionsEnabled && matchPredictionsQuery.isPending,
    hasMatchStarted,
  }
}
