import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useRounds } from './useRounds'

export function useRoundPayments() {
  const { rounds, activeRound, loading: roundsLoading } = useRounds()
  const [selectedRound, setSelectedRound] = useState(null)
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(false)
  const [savingByUser, setSavingByUser] = useState({})

  useEffect(() => {
    if (selectedRound) return

    if (activeRound?.round_number) {
      setSelectedRound(activeRound.round_number)
      return
    }

    if (rounds.length > 0) {
      setSelectedRound(rounds[0].round_number)
    }
  }, [selectedRound, activeRound, rounds])

  const fetchPayments = useCallback(async roundNumber => {
    if (!roundNumber) {
      setPayments([])
      return { error: null }
    }

    try {
      setLoading(true)
      const { data, error } = await supabase.rpc('get_round_payments_status', {
        p_round_number: roundNumber,
      })

      if (error) throw error

      setPayments(
        (data || []).map(row => ({
          userId: row.user_id,
          username: row.username,
          fullName: row.full_name,
          hasPaid: row.has_paid,
          paidAt: row.paid_at,
        }))
      )

      return { error: null }
    } catch (error) {
      return { error }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!selectedRound) return
    fetchPayments(selectedRound)
  }, [selectedRound, fetchPayments])

  const updateUserPayment = useCallback(
    async (userId, hasPaid) => {
      if (!selectedRound) {
        return { error: new Error('No hay fecha seleccionada') }
      }

      const previousPayments = payments

      setSavingByUser(prev => ({ ...prev, [userId]: true }))
      setPayments(prev => prev.map(item => (item.userId === userId ? { ...item, hasPaid } : item)))

      try {
        const { error } = await supabase.rpc('set_round_payment_status', {
          p_round_number: selectedRound,
          p_user_id: userId,
          p_has_paid: hasPaid,
        })

        if (error) throw error

        return { error: null }
      } catch (error) {
        setPayments(previousPayments)
        return { error }
      } finally {
        setSavingByUser(prev => ({ ...prev, [userId]: false }))
      }
    },
    [selectedRound, payments]
  )

  const stats = useMemo(() => {
    const total = payments.length
    const paid = payments.filter(item => item.hasPaid).length
    return {
      total,
      paid,
      pending: total - paid,
    }
  }, [payments])

  return {
    rounds,
    roundsLoading,
    selectedRound,
    setSelectedRound,
    payments,
    loading,
    savingByUser,
    stats,
    fetchPayments,
    updateUserPayment,
  }
}
