import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getNextActiveRoundNumber } from '../utils/matchTiming'

export const useRounds = (tournamentId = null) => {
  const [rounds, setRounds] = useState([])
  const [activeRound, setActiveRound] = useState(null)
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchRounds = useCallback(async () => {
    try {
      setLoading(true)
      let query = supabase.from('rounds').select('*')

      if (tournamentId) {
        query = query.eq('tournament_id', tournamentId)
      }

      const { data, error } = await query.order('round_number', { ascending: true })

      if (error) throw error

      setRounds(data || [])

      let matchesQuery = supabase.from('matches').select('id, round_number, match_date')

      if (tournamentId) {
        matchesQuery = matchesQuery.eq('tournament_id', tournamentId)
      }

      const { data: matchesData, error: matchesError } = await matchesQuery

      if (matchesError) throw matchesError

      setMatches(matchesData || [])

      const activeRoundNumber = getNextActiveRoundNumber(data || [], matchesData || [])
      const active = (data || []).find(r => r.round_number === activeRoundNumber) || null
      setActiveRound(active)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }, [tournamentId])

  useEffect(() => {
    fetchRounds()
  }, [fetchRounds])

  const updateRoundStatus = async (roundNumber, status) => {
    try {
      let query = supabase
        .from('rounds')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('round_number', roundNumber)

      if (tournamentId) {
        query = query.eq('tournament_id', tournamentId)
      }

      const { error } = await query

      if (error) throw error

      setRounds(prev => {
        const updated = prev.map(r =>
          r.round_number === roundNumber
            ? { ...r, status, updated_at: new Date().toISOString() }
            : r
        )
        const activeRoundNumber = getNextActiveRoundNumber(updated, matches)
        const active = updated.find(r => r.round_number === activeRoundNumber) || null
        setActiveRound(active)
        return updated
      })

      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const lockRound = async roundNumber => {
    try {
      let query = supabase
        .from('rounds')
        .update({ status: 'locked', updated_at: new Date().toISOString() })
        .eq('round_number', roundNumber)

      if (tournamentId) {
        query = query.eq('tournament_id', tournamentId)
      }

      const { error } = await query

      if (error) throw error

      setRounds(prev => {
        const updated = prev.map(r =>
          r.round_number === roundNumber
            ? { ...r, status: 'locked', updated_at: new Date().toISOString() }
            : r
        )
        const activeRoundNumber = getNextActiveRoundNumber(updated, matches)
        const active = updated.find(r => r.round_number === activeRoundNumber) || null
        setActiveRound(active)
        return updated
      })

      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const finishRound = async roundNumber => {
    try {
      let query = supabase
        .from('rounds')
        .update({ status: 'finished', updated_at: new Date().toISOString() })
        .eq('round_number', roundNumber)

      if (tournamentId) {
        query = query.eq('tournament_id', tournamentId)
      }

      const { error } = await query

      if (error) throw error

      setRounds(prev => {
        const updated = prev.map(r =>
          r.round_number === roundNumber
            ? { ...r, status: 'finished', updated_at: new Date().toISOString() }
            : r
        )
        const activeRoundNumber = getNextActiveRoundNumber(updated, matches)
        const active = updated.find(r => r.round_number === activeRoundNumber) || null
        setActiveRound(active)
        return updated
      })

      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const openNextRound = async () => {
    try {
      // Buscar la primera fecha en estado 'pending' usando el estado actual
      let pendingRound = null
      setRounds(prev => {
        pendingRound = prev.find(r => r.status === 'pending')
        return prev
      })

      if (!pendingRound) {
        throw new Error('No hay fechas pendientes para abrir')
      }

      // Abrir la fecha pending
      await updateRoundStatus(pendingRound.round_number, 'open')

      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const isRoundOpen = roundNumber => {
    const round = rounds.find(r => r.round_number === roundNumber)
    return round?.status === 'open'
  }

  const canPredictRound = roundNumber => isRoundOpen(roundNumber)

  return {
    rounds,
    activeRound,
    loading,
    error,
    fetchRounds,
    updateRoundStatus,
    openNextRound,
    lockRound,
    finishRound,
    isRoundOpen,
    canPredictRound,
  }
}
