import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useRounds } from './useRounds'
import { useTournament } from '../contexts/TournamentContext'

export function useRoundPayments() {
  const { activeTournament } = useTournament()
  const { rounds, activeRound, loading: roundsLoading } = useRounds(activeTournament?.id)
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
      let data = null

      if (activeTournament?.id) {
        const tournamentRpc = await supabase.rpc('get_round_payments_status_by_tournament', {
          p_tournament_id: activeTournament.id,
          p_round_number: roundNumber,
        })

        if (!tournamentRpc.error) {
          data = tournamentRpc.data
        }
      }

      if (!data) {
        const legacyRpc = await supabase.rpc('get_round_payments_status', {
          p_round_number: roundNumber,
        })

        if (legacyRpc.error) throw legacyRpc.error
        data = legacyRpc.data
      }

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
  }, [activeTournament?.id])

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
        let error = null

        if (hasPaid) {
          const allocations = [{ round_number: selectedRound, allocated_amount: 2000 }]

          if (activeTournament?.id) {
            const tournamentResponse = await supabase.rpc('register_payment_by_tournament', {
              p_tournament_id: activeTournament.id,
              p_user_id: userId,
              p_total_amount: 2000,
              p_payment_method: 'Transferencia',
              p_allocations: allocations,
            })

            if (!tournamentResponse.error) {
              error = null
            } else {
              const legacyResponse = await supabase.rpc('register_payment', {
                p_user_id: userId,
                p_total_amount: 2000,
                p_payment_method: 'Transferencia',
                p_allocations: allocations,
              })
              error = legacyResponse.error
            }
          } else {
            const legacyResponse = await supabase.rpc('register_payment', {
              p_user_id: userId,
              p_total_amount: 2000,
              p_payment_method: 'Transferencia',
              p_allocations: allocations,
            })
            error = legacyResponse.error
          }
        } else {
          if (activeTournament?.id) {
            const tournamentResponse = await supabase.rpc('remove_round_allocation_by_tournament', {
              p_tournament_id: activeTournament.id,
              p_user_id: userId,
              p_round_number: selectedRound,
            })

            if (!tournamentResponse.error) {
              error = null
            } else {
              const legacyResponse = await supabase.rpc('remove_round_allocation', {
                p_user_id: userId,
                p_round_number: selectedRound,
              })
              error = legacyResponse.error
            }
          } else {
            const legacyResponse = await supabase.rpc('remove_round_allocation', {
              p_user_id: userId,
              p_round_number: selectedRound,
            })
            error = legacyResponse.error
          }
        }

        if (error) throw error

        return { error: null }
      } catch (error) {
        setPayments(previousPayments)
        return { error }
      } finally {
        setSavingByUser(prev => ({ ...prev, [userId]: false }))
      }
    },
    [selectedRound, payments, activeTournament?.id]
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
