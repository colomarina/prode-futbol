import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const emptyStats = {
  metrics: {
    totalPoints: 0,
    hitPercentage: 0,
    avgPerRound: 0,
  },
  evolutionByRound: [],
  bestRound: {
    roundNumber: null,
    points: 0,
  },
  worstRound: {
    roundNumber: null,
    points: 0,
  },
  accuracyBreakdown: {
    exactScores: 0,
    winnerHits: 0,
    bonusGoals: 0,
    totalAnalyzed: 0,
    goalDiffCorrect: 0,
    winnerOnly: 0,
    errors: 0,
  },
  additionalStats: {
    totalPredictions: 0,
    avgPointsPerMatch: 0,
    finishedMatches: 0,
  },
}

const getOutcome = (home, away) => {
  if (home > away) return 1
  if (home < away) return -1
  return 0
}

const buildTournamentStats = (matches, predictions) => {
  const predictionsByMatchId = new Map((predictions || []).map(pred => [pred.match_id, pred]))

  const finishedMatches = (matches || []).filter(match => match.is_finished)
  const analyzedPredictions = []

  finishedMatches.forEach(match => {
    const prediction = predictionsByMatchId.get(match.id)
    if (!prediction) return
    analyzedPredictions.push({
      match,
      prediction,
    })
  })

  let exactScores = 0
  let goalDiffCorrect = 0
  let winnerOnly = 0
  let errors = 0

  analyzedPredictions.forEach(({ match, prediction }) => {
    const realHome = Number(match.home_score)
    const realAway = Number(match.away_score)
    const predHome = Number(prediction.home_prediction)
    const predAway = Number(prediction.away_prediction)

    const isExact = predHome === realHome && predAway === realAway
    if (isExact) {
      exactScores += 1
      return
    }

    const realOutcome = getOutcome(realHome, realAway)
    const predOutcome = getOutcome(predHome, predAway)

    if (realOutcome === predOutcome) {
      const realDiff = realHome - realAway
      const predDiff = predHome - predAway

      if (realDiff === predDiff) {
        goalDiffCorrect += 1
      } else {
        winnerOnly += 1
      }
      return
    }

    errors += 1
  })

  const winnerHits = goalDiffCorrect + winnerOnly
  const totalAnalyzed = analyzedPredictions.length
  const totalPredictions = predictions?.length || 0
  const totalPoints = analyzedPredictions.reduce(
    (acc, entry) => acc + Number(entry.prediction.points || 0),
    0
  )

  const pointsByRound = new Map()
  analyzedPredictions.forEach(({ match, prediction }) => {
    const roundNumber = match.round_number
    const current = pointsByRound.get(roundNumber) || 0
    pointsByRound.set(roundNumber, current + Number(prediction.points || 0))
  })

  const evolutionByRound = Array.from(pointsByRound.entries())
    .map(([roundNumber, points]) => ({ roundNumber, points }))
    .sort((a, b) => a.roundNumber - b.roundNumber)

  const bestRound =
    evolutionByRound.length > 0
      ? evolutionByRound.reduce((best, round) => (round.points > best.points ? round : best))
      : { roundNumber: null, points: 0 }

  const worstRound =
    evolutionByRound.length > 0
      ? evolutionByRound.reduce((worst, round) => (round.points < worst.points ? round : worst))
      : { roundNumber: null, points: 0 }

  const roundsCount = evolutionByRound.length
  const hitPercentage =
    totalAnalyzed > 0 ? Number((((exactScores + winnerHits) / totalAnalyzed) * 100).toFixed(1)) : 0
  const avgPerRound = roundsCount > 0 ? totalPoints / roundsCount : 0
  const avgPointsPerMatch = totalAnalyzed > 0 ? totalPoints / totalAnalyzed : 0

  return {
    metrics: {
      totalPoints,
      hitPercentage,
      avgPerRound,
    },
    evolutionByRound,
    bestRound: {
      roundNumber: bestRound.roundNumber,
      points: bestRound.points,
    },
    worstRound: {
      roundNumber: worstRound.roundNumber,
      points: worstRound.points,
    },
    accuracyBreakdown: {
      exactScores,
      winnerHits,
      bonusGoals: 0,
      totalAnalyzed,
      goalDiffCorrect,
      winnerOnly,
      errors,
    },
    additionalStats: {
      totalPredictions,
      avgPointsPerMatch,
      finishedMatches: finishedMatches.length,
    },
  }
}

export const usePersonalStats = (userId, tournamentId = null) => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true

    const loadStats = async () => {
      if (!userId) {
        if (mounted) {
          setStats(emptyStats)
          setLoading(false)
        }
        return
      }

      setLoading(true)
      setError(null)

      if (tournamentId) {
        const { data: tournamentMatches, error: matchesError } = await supabase
          .from('matches')
          .select('id, round_number, home_score, away_score, is_finished')
          .eq('tournament_id', tournamentId)

        if (!mounted) return

        if (matchesError) {
          setError('No se pudieron cargar las estadísticas personales')
          setLoading(false)
          return
        }

        const matchIds = (tournamentMatches || []).map(match => match.id)

        if (matchIds.length === 0) {
          setStats(emptyStats)
          setLoading(false)
          return
        }

        const { data: predictionsData, error: predictionsError } = await supabase
          .from('predictions')
          .select('match_id, home_prediction, away_prediction, points')
          .eq('user_id', userId)
          .in('match_id', matchIds)

        if (!mounted) return

        if (predictionsError) {
          setError('No se pudieron cargar las estadísticas personales')
          setLoading(false)
          return
        }

        setStats(buildTournamentStats(tournamentMatches || [], predictionsData || []))
        setLoading(false)
        return
      }

      const { data, error: rpcError } = await supabase.rpc('get_personal_stats')

      if (!mounted) return

      if (rpcError) {
        setError('No se pudieron cargar las estadísticas personales')
        setLoading(false)
        return
      }

      setStats(data || emptyStats)
      setLoading(false)
    }

    loadStats()

    return () => {
      mounted = false
    }
  }, [userId, tournamentId])

  return { stats, loading, error }
}
