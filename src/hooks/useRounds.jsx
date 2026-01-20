import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const useRounds = () => {
  const [rounds, setRounds] = useState([])
  const [activeRound, setActiveRound] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchRounds()
  }, [])

  const fetchRounds = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('rounds')
        .select('*')
        .order('round_number', { ascending: true })

      if (error) throw error

      setRounds(data)

      // Encontrar la fecha activa (open)
      const active = data.find(r => r.status === 'open')
      setActiveRound(active)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const updateRoundStatus = async (roundNumber, status) => {
    try {
      const { error } = await supabase
        .from('rounds')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('round_number', roundNumber)

      if (error) throw error
      await fetchRounds()
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const lockRound = async roundNumber => {
    try {
      const { error } = await supabase
        .from('rounds')
        .update({ status: 'locked', updated_at: new Date().toISOString() })
        .eq('round_number', roundNumber)

      if (error) throw error
      await fetchRounds()
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const finishRound = async roundNumber => {
    try {
      const { error } = await supabase
        .from('rounds')
        .update({ status: 'finished', updated_at: new Date().toISOString() })
        .eq('round_number', roundNumber)

      if (error) throw error
      await fetchRounds()
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const openNextRound = async () => {
    try {
      // Buscar la primera fecha en estado 'pending'
      const pendingRound = rounds.find(r => r.status === 'pending')

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
