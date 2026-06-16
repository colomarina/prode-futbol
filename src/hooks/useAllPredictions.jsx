import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRounds } from './useRounds'
import { useMatches } from './useMatches'
import { useTournament } from '../contexts/TournamentContext'
import { supabase } from '../lib/supabase'
import { filterHiddenPlayers } from '../constants/hiddenPlayers'
import { hasMatchStarted } from '../utils/matchTiming'

export function useAllPredictions({ initialRound = null, initialUser = '' } = {}) {
  const { activeTournament } = useTournament()
  const { rounds, loading: roundsLoading } = useRounds(activeTournament?.id)
  const [selectedRound, setSelectedRound] = useState(initialRound || null)
  const { matches, loading: matchesLoading } = useMatches(selectedRound, activeTournament?.id)
  const [allMatches, setAllMatches] = useState([])
  const [roundPredictions, setRoundPredictions] = useState({})
  const [matchPredictions, setMatchPredictions] = useState({})
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState('')
  const [selectedMatchId, setSelectedMatchId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [matchLoading, setMatchLoading] = useState(false)
  const [viewMode, setViewMode] = useState('by-match')

  useEffect(() => {
    if (initialUser && viewMode === 'by-user') setSelectedUser(initialUser)
  }, [initialUser, viewMode])

  useEffect(() => {
    setSelectedMatchId(null)
    setMatchPredictions({})
  }, [selectedRound])

  useEffect(() => {
    if (viewMode === 'by-user') {
      setSelectedMatchId(null)
      setMatchPredictions({})
    } else {
      setSelectedUser('')
      setRoundPredictions({})
    }
  }, [viewMode])

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, full_name')
          .order('full_name')
        if (error) throw error
        setUsers(filterHiddenPlayers(data || []))
      } catch {
        /* silent */
      }
    }
    fetchUsers()
  }, [])

  useEffect(() => {
    const fetchAllMatches = async () => {
      try {
        let query = supabase.from('matches').select('id, round_number, match_date')

        if (activeTournament?.id) {
          query = query.eq('tournament_id', activeTournament.id)
        }

        const { data, error } = await query

        if (error) throw error

        setAllMatches(data || [])
      } catch {
        setAllMatches([])
      }
    }

    fetchAllMatches()
  }, [activeTournament?.id])

  const availableRounds = useMemo(
    () =>
      rounds
        .filter(round =>
          allMatches.some(
            match => match.round_number === round.round_number && hasMatchStarted(match.match_date)
          )
        )
        .sort((a, b) => a.round_number - b.round_number),
    [allMatches, rounds]
  )

  const selectedUserData = useMemo(
    () => users.find(u => u.id === selectedUser),
    [users, selectedUser]
  )

  const selectedMatch = useMemo(
    () => matches.find(m => m.id === selectedMatchId),
    [matches, selectedMatchId]
  )

  const selectedRoundHasStartedMatches = useMemo(
    () => matches.some(match => hasMatchStarted(match.match_date)),
    [matches]
  )

  const fetchPredictionsForRound = useCallback(async () => {
    if (!selectedRound || !selectedUser || !matches.length) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .in(
          'match_id',
          matches.map(m => m.id)
        )
        .eq('user_id', selectedUser)
      if (error) throw error
      const byMatch = {}
      data?.forEach(pred => {
        byMatch[pred.match_id] = pred
      })
      setRoundPredictions(byMatch)
    } catch {
      setRoundPredictions({})
    } finally {
      setLoading(false)
    }
  }, [selectedRound, selectedUser, matches])

  const fetchPredictionsForMatch = useCallback(async () => {
    if (!selectedMatchId) return
    setMatchLoading(true)
    try {
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .eq('match_id', selectedMatchId)
      if (error) throw error
      const byUser = {}
      data?.forEach(pred => {
        byUser[pred.user_id] = pred
      })
      setMatchPredictions(byUser)
    } catch {
      setMatchPredictions({})
    } finally {
      setMatchLoading(false)
    }
  }, [selectedMatchId])

  useEffect(() => {
    if (viewMode !== 'by-user') return
    if (selectedRound && selectedUser && selectedRoundHasStartedMatches) fetchPredictionsForRound()
    else setRoundPredictions({})
  }, [
    viewMode,
    selectedRound,
    selectedUser,
    selectedRoundHasStartedMatches,
    fetchPredictionsForRound,
  ])

  useEffect(() => {
    if (viewMode !== 'by-match') return
    if (
      selectedRound &&
      selectedMatchId &&
      selectedMatch &&
      hasMatchStarted(selectedMatch.match_date)
    ) {
      fetchPredictionsForMatch()
    } else setMatchPredictions({})
  }, [viewMode, selectedRound, selectedMatchId, selectedMatch, fetchPredictionsForMatch])

  return {
    rounds,
    roundsLoading,
    availableRounds,
    matches,
    matchesLoading,
    users,
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
    roundPredictions,
    matchPredictions,
    loading,
    matchLoading,
    hasMatchStarted,
  }
}
