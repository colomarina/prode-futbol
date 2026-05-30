import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useRounds } from './useRounds'
import { useTournament } from '../contexts/TournamentContext'

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
  const { activeTournament } = useTournament()
  const { rounds, activeRound } = useRounds(activeTournament?.id)
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
      let data = null

      if (activeTournament?.id) {
        const tournamentRpc = await supabase.rpc('get_all_round_financial_summaries_by_tournament', {
          p_tournament_id: activeTournament.id,
        })

        if (!tournamentRpc.error) {
          data = tournamentRpc.data
        }
      }

      if (!data) {
        const legacyRpc = await supabase.rpc('get_all_round_financial_summaries')
        if (legacyRpc.error) throw legacyRpc.error

        const tournamentRoundNumbers = new Set((rounds || []).map(round => round.round_number))
        data = (legacyRpc.data || []).filter(row => tournamentRoundNumbers.has(row.round_number))
      }

      setSummaries((data || []).map(mapRow))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [rounds, activeTournament?.id])

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
        let rpcError = null

        if (activeTournament?.id) {
          const tournamentRpc = await supabase.rpc('upsert_round_finance_by_tournament', {
            p_tournament_id: activeTournament.id,
            p_round_number: roundNumber,
            p_entry_fee: entryFee,
            p_prize_amount: prizeAmount,
          })

          if (!tournamentRpc.error) {
            rpcError = null
          } else {
            const legacyRpc = await supabase.rpc('upsert_round_finance', {
              p_round_number: roundNumber,
              p_entry_fee: entryFee,
              p_prize_amount: prizeAmount,
            })
            rpcError = legacyRpc.error
          }
        } else {
          const legacyRpc = await supabase.rpc('upsert_round_finance', {
            p_round_number: roundNumber,
            p_entry_fee: entryFee,
            p_prize_amount: prizeAmount,
          })
          rpcError = legacyRpc.error
        }

        if (rpcError) throw rpcError
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
    [summaries, fetchSummaries, activeTournament?.id]
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
