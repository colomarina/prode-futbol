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

  const openNextRound = async () => {
    try {
      // Cerrar la fecha actual
      if (activeRound) {
        await updateRoundStatus(activeRound.round_number, 'finished')
      }

      // Abrir la siguiente
      const nextRoundNumber = activeRound ? activeRound.round_number + 1 : 1
      await updateRoundStatus(nextRoundNumber, 'open')

      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const isRoundOpen = (roundNumber) => {
    const round = rounds.find(r => r.round_number === roundNumber)
    return round?.status === 'open'
  }

  const canPredictRound = (roundNumber) => {
    return isRoundOpen(roundNumber)
  }

  return {
    rounds,
    activeRound,
    loading,
    error,
    fetchRounds,
    updateRoundStatus,
    openNextRound,
    isRoundOpen,
    canPredictRound,
  }
}
