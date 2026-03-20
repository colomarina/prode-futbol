import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useRounds } from './useRounds'

function mapRow(row) {
  const paidUsers = Number(row.paid_users)
  const pendingUsers = Number(row.pending_users)
  const total = paidUsers + pendingUsers
  return {
    roundNumber: row.round_number,
    roundStatus: row.round_status,
    entryFeeAmount: row.entry_fee_amount,
    prizeAmount: row.prize_amount,
    paidUsers,
    pendingUsers,
    collectedAmount: Number(row.collected_amount),
    differenceAmount: Number(row.difference_amount),
    runningBalance: Number(row.running_balance),
    coverageRate: total > 0 ? Math.round((paidUsers / total) * 100) : 0,
  }
}

export function useRoundFinance() {
  const { rounds, activeRound } = useRounds()
  const [selectedRound, setSelectedRound] = useState(null)
  const [summaries, setSummaries] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

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

  const fetchSummaries = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase.rpc('get_all_round_financial_summaries')
      if (error) throw error
      setSummaries((data || []).map(mapRow))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSummaries()
  }, [fetchSummaries])

  const savePrize = useCallback(
    async (roundNumber, prizeAmount) => {
      const current = summaries.find(s => s.roundNumber === roundNumber)
      const entryFee = current?.entryFeeAmount ?? 2000

      // Optimistic update
      setSummaries(prev =>
        prev.map(s => (s.roundNumber === roundNumber ? { ...s, prizeAmount } : s))
      )

      try {
        setSaving(true)
        const { error } = await supabase.rpc('upsert_round_finance', {
          p_round_number: roundNumber,
          p_entry_fee: entryFee,
          p_prize_amount: prizeAmount,
        })
        if (error) throw error
        // Refetch para recalcular saldo acumulado con los valores reales
        await fetchSummaries()
      } catch (err) {
        setError(err.message)
        // Revertir optimistic update
        await fetchSummaries()
      } finally {
        setSaving(false)
      }
    },
    [summaries, fetchSummaries]
  )

  const selectedSummary = useMemo(
    () => summaries.find(s => s.roundNumber === selectedRound) ?? summaries[0] ?? null,
    [summaries, selectedRound]
  )

  const overview = useMemo(() => {
    const last = summaries.at(-1)
    return {
      currentBalance: last?.runningBalance ?? 0,
      selectedCollected: selectedSummary?.collectedAmount ?? 0,
      selectedPrize: selectedSummary?.prizeAmount ?? 0,
      selectedDifference: selectedSummary?.differenceAmount ?? 0,
      totalRounds: summaries.length,
    }
  }, [summaries, selectedSummary])

  return {
    selectedRound,
    setSelectedRound,
    summaries,
    selectedSummary,
    overview,
    loading,
    saving,
    error,
    savePrize,
    refetch: fetchSummaries,
  }
}
