import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/queryKeys'
import { isHiddenPlayer } from '../constants/hiddenPlayers'
import { compareByPoints, assignPositions } from '../utils/ranking'

const emptyStats = {
  metrics: {
    totalPoints: 0,
    hitPercentage: 0,
    avgPerRound: 0,
    currentPosition: null,
    totalParticipants: 0,
  },
  evolutionByRound: [],
  positionByRound: [],
  streaks: {
    longestPointStreak: 0,
    longestPlenoStreak: 0,
    longestTop3Streak: 0,
    longestTop10Streak: 0,
  },
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
  teamStats: {
    favoriteTeam: null,
    bestReadTeam: null,
    worstReadTeam: null,
  },
  personalRecords: {
    bestMatch: null,
    mostPreciseRound: null,
  },
  history: {
    roundsWon: 0,
    podiums: 0,
    bestPosition: null,
    bestPositionRound: null,
    roundsImproved: 0,
  },
}

const getOutcome = (home, away) => {
  if (home > away) return 1
  if (home < away) return -1
  return 0
}

const getTeamRecord = (teamRecords, team) => {
  if (!team?.id) return null

  const existing = teamRecords.get(team.id)
  if (existing) return existing

  const record = {
    team,
    matches: 0,
    correctMatches: 0,
    predictedWinnerCount: 0,
  }

  teamRecords.set(team.id, record)
  return record
}

const normalizeStats = stats => {
  return {
    ...emptyStats,
    ...stats,
    metrics: {
      ...emptyStats.metrics,
      ...(stats?.metrics || {}),
    },
    accuracyBreakdown: {
      ...emptyStats.accuracyBreakdown,
      ...(stats?.accuracyBreakdown || {}),
    },
    additionalStats: {
      ...emptyStats.additionalStats,
      ...(stats?.additionalStats || {}),
    },
    teamStats: {
      ...emptyStats.teamStats,
      ...(stats?.teamStats || {}),
    },
    personalRecords: {
      ...emptyStats.personalRecords,
      ...(stats?.personalRecords || {}),
    },
    history: {
      ...emptyStats.history,
      ...(stats?.history || {}),
    },
    streaks: {
      ...emptyStats.streaks,
      ...(stats?.streaks || {}),
    },
  }
}

const getLongestConsecutive = (items, predicate) => {
  let longest = 0
  let current = 0

  items.forEach(item => {
    if (predicate(item)) {
      current += 1
      longest = Math.max(longest, current)
    } else {
      current = 0
    }
  })

  return longest
}

const buildPositionHistory = (roundScores, userId) => {
  const scoresByRound = new Map()
  ;(roundScores || []).forEach(score => {
    const roundNumber = score.round_number
    if (!scoresByRound.has(roundNumber)) {
      scoresByRound.set(roundNumber, [])
    }
    scoresByRound.get(roundNumber).push(score)
  })

  const userIdString = String(userId)
  const roundNumbers = Array.from(scoresByRound.keys()).sort((a, b) => a - b)
  const history = []

  roundNumbers.forEach(roundNumber => {
    const scores = scoresByRound.get(roundNumber) || []
    const rankedUsers = assignPositions(
      scores
        .slice()
        .sort(
          compareByPoints(
            score => score.total_points,
            score => score.user_id
          )
        )
        .map(score => ({
          userId: String(score.user_id),
          totalPoints: Number(score.total_points || 0),
        }))
    )

    const userEntry = rankedUsers.find(item => item.userId === userIdString)
    if (userEntry) {
      history.push({
        roundNumber,
        position: userEntry.position,
        totalPoints: userEntry.totalPoints,
      })
    }
  })

  return history
}

const buildOverallRanking = roundScores => {
  const totalsByUser = new Map()
  ;(roundScores || []).forEach(score => {
    const userIdString = String(score.user_id)
    const current = totalsByUser.get(userIdString) || 0
    totalsByUser.set(userIdString, current + Number(score.total_points || 0))
  })

  return assignPositions(
    Array.from(totalsByUser.entries())
      .map(([userId, totalPoints]) => ({
        userId,
        totalPoints,
      }))
      .sort(
        compareByPoints(
          entry => entry.totalPoints,
          entry => entry.userId
        )
      )
  )
}

const buildTournamentStats = (matches, predictions, roundScores, userId) => {
  const predictionsByMatchId = new Map((predictions || []).map(pred => [pred.match_id, pred]))

  const finishedMatches = (matches || []).filter(match => match.is_finished)
  const sortedFinishedMatches = [...finishedMatches].sort(
    (a, b) => new Date(a.match_date) - new Date(b.match_date)
  )

  const analyzedPredictions = []
  sortedFinishedMatches.forEach(match => {
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
  let bonusGoals = 0
  let matchesWithPoints = 0

  const pointsByRound = new Map()
  const roundPredictionStats = new Map()
  const teamRecords = new Map()

  analyzedPredictions.forEach(({ match, prediction }) => {
    const realHome = Number(match.home_score)
    const realAway = Number(match.away_score)
    const predHome = Number(prediction.home_prediction)
    const predAway = Number(prediction.away_prediction)

    const isExact = predHome === realHome && predAway === realAway
    const realOutcome = getOutcome(realHome, realAway)
    const predOutcome = getOutcome(predHome, predAway)
    const points = Number(prediction.points || 0)

    if (points > 0) matchesWithPoints += 1

    if (isExact) {
      exactScores += 1
    } else if (realOutcome === predOutcome) {
      const realDiff = realHome - realAway
      const predDiff = predHome - predAway

      if (realDiff === predDiff) {
        goalDiffCorrect += 1
      } else {
        winnerOnly += 1
      }
    } else {
      errors += 1
    }

    if (match.home_team && match.away_team) {
      const homeRecord = getTeamRecord(teamRecords, match.home_team)
      const awayRecord = getTeamRecord(teamRecords, match.away_team)

      if (homeRecord) {
        homeRecord.matches += 1
        if (points > 0) homeRecord.correctMatches += 1
      }

      if (awayRecord) {
        awayRecord.matches += 1
        if (points > 0) awayRecord.correctMatches += 1
      }
    }

    if (predOutcome === 1 && match.home_team) {
      const homeRecord = getTeamRecord(teamRecords, match.home_team)
      if (homeRecord) homeRecord.predictedWinnerCount += 1
    }

    if (predOutcome === -1 && match.away_team) {
      const awayRecord = getTeamRecord(teamRecords, match.away_team)
      if (awayRecord) awayRecord.predictedWinnerCount += 1
    }

    const totalGoals = realHome + realAway
    if (totalGoals > 2 && predHome + predAway === totalGoals) {
      bonusGoals += 1
    }

    const roundNumber = match.round_number
    pointsByRound.set(roundNumber, (pointsByRound.get(roundNumber) || 0) + points)

    const roundStats = roundPredictionStats.get(roundNumber) || {
      roundNumber,
      correct: 0,
      total: 0,
    }
    roundStats.total += 1
    if (points > 0) roundStats.correct += 1
    roundPredictionStats.set(roundNumber, roundStats)
  })

  const totalAnalyzed = analyzedPredictions.length
  const totalPredictions = predictions?.length || 0
  const totalPoints = analyzedPredictions.reduce(
    (acc, entry) => acc + Number(entry.prediction.points || 0),
    0
  )

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
    totalAnalyzed > 0 ? Number(((matchesWithPoints / totalAnalyzed) * 100).toFixed(1)) : 0
  const avgPerRound = roundsCount > 0 ? totalPoints / roundsCount : 0
  const avgPointsPerMatch = totalAnalyzed > 0 ? totalPoints / totalAnalyzed : 0

  const teamArray = Array.from(teamRecords.values())
  const MIN_TEAM_PREDICTIONS = 3

  const favoriteTeam = teamArray.reduce((best, record) => {
    if (!best || record.predictedWinnerCount > best.predictedWinnerCount) return record
    return best
  }, null)

  const filteredTeamAccuracy = teamArray.filter(record => record.matches >= MIN_TEAM_PREDICTIONS)
  const fallbackTeamAccuracy = teamArray.filter(record => record.matches > 0)
  const accuracyCandidates =
    filteredTeamAccuracy.length > 0 ? filteredTeamAccuracy : fallbackTeamAccuracy

  const bestReadTeam = accuracyCandidates.reduce((best, record) => {
    const accuracy = record.correctMatches / record.matches
    const bestAccuracy = best ? best.correctMatches / best.matches : -1
    if (accuracy > bestAccuracy) return record
    return best
  }, null)

  const worstReadTeam = accuracyCandidates.reduce((worst, record) => {
    const accuracy = record.correctMatches / record.matches
    const worstAccuracy = worst ? worst.correctMatches / worst.matches : 1
    if (!worst || accuracy < worstAccuracy) return record
    return worst
  }, null)

  const positionHistory = buildPositionHistory(roundScores, userId)
  const overallRanking = buildOverallRanking(roundScores)
  const currentPositionEntry = overallRanking.find(item => item.userId === String(userId))
  const currentPosition = currentPositionEntry ? currentPositionEntry.position : null
  const totalParticipants = roundScores ? new Set(roundScores.map(score => score.user_id)).size : 0

  const bestPositionEntry = positionHistory.reduce((best, entry) => {
    if (!best || entry.position < best.position) return entry
    return best
  }, null)

  const roundsWon = positionHistory.filter(entry => entry.position === 1).length
  const podiums = positionHistory.filter(entry => entry.position > 0 && entry.position <= 3).length
  const roundsImproved = positionHistory.reduce((count, entry, index) => {
    if (index === 0) return 0
    const previous = positionHistory[index - 1]
    if (previous.position > entry.position) return count + 1
    return count
  }, 0)

  const top3Streak = getLongestConsecutive(positionHistory, entry => entry.position <= 3)
  const top10Streak = getLongestConsecutive(positionHistory, entry => entry.position <= 10)

  const positionByRound = positionHistory.map(entry => ({
    roundNumber: entry.roundNumber,
    points: entry.position,
  }))

  const bestMatch = analyzedPredictions.reduce((best, entry) => {
    const points = Number(entry.prediction.points || 0)
    if (!best || points > best.points) {
      return {
        match: entry.match,
        prediction: entry.prediction,
        points,
      }
    }
    return best
  }, null)

  const mostPreciseRound = Array.from(roundPredictionStats.values())
    .filter(stat => stat.total > 0)
    .map(stat => ({
      roundNumber: stat.roundNumber,
      percentage: Number(((stat.correct / stat.total) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.percentage - a.percentage || a.roundNumber - b.roundNumber)[0]

  const longestPointStreak = getLongestConsecutive(
    analyzedPredictions,
    ({ prediction }) => Number(prediction.points || 0) > 0
  )

  const longestPlenoStreak = getLongestConsecutive(analyzedPredictions, ({ match, prediction }) => {
    const realHome = Number(match.home_score)
    const realAway = Number(match.away_score)
    const predHome = Number(prediction.home_prediction)
    const predAway = Number(prediction.away_prediction)
    return predHome === realHome && predAway === realAway
  })

  return {
    metrics: {
      totalPoints,
      hitPercentage,
      avgPerRound,
      currentPosition,
      totalParticipants,
    },
    evolutionByRound,
    positionByRound,
    streaks: {
      longestPointStreak: longestPointStreak || 0,
      longestPlenoStreak: longestPlenoStreak || 0,
      longestTop3Streak: top3Streak || 0,
      longestTop10Streak: top10Streak || 0,
    },
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
      winnerHits: goalDiffCorrect + winnerOnly,
      bonusGoals,
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
    teamStats: {
      favoriteTeam: favoriteTeam
        ? {
            name: favoriteTeam.team.name,
            count: favoriteTeam.predictedWinnerCount,
          }
        : null,
      bestReadTeam: bestReadTeam
        ? {
            name: bestReadTeam.team.name,
            percentage: Number(
              ((bestReadTeam.correctMatches / bestReadTeam.matches) * 100).toFixed(1)
            ),
            matches: bestReadTeam.matches,
          }
        : null,
      worstReadTeam: worstReadTeam
        ? {
            name: worstReadTeam.team.name,
            percentage: Number(
              ((worstReadTeam.correctMatches / worstReadTeam.matches) * 100).toFixed(1)
            ),
            matches: worstReadTeam.matches,
          }
        : null,
    },
    personalRecords: {
      bestMatch:
        bestMatch && bestMatch.match
          ? {
              match: bestMatch.match,
              prediction: bestMatch.prediction,
              points: bestMatch.points,
            }
          : null,
      mostPreciseRound: mostPreciseRound
        ? {
            roundNumber: mostPreciseRound.roundNumber,
            percentage: mostPreciseRound.percentage,
          }
        : null,
    },
    history: {
      roundsWon,
      podiums,
      bestPosition: bestPositionEntry ? bestPositionEntry.position : null,
      bestPositionRound: bestPositionEntry ? bestPositionEntry.roundNumber : null,
      roundsImproved,
    },
  }
}

/**
 * Trae todo lo necesario para las estadísticas del torneo.
 *
 * `round_scores` no depende de los partidos —le alcanza con el torneo—, así que
 * corre en paralelo con ellos. Solo los pronósticos tienen que esperar, porque
 * necesitan los ids de los partidos. Antes eran tres consultas encadenadas.
 */
const fetchTournamentStats = async (userId, tournamentId) => {
  const [matchesResult, roundScoresResult] = await Promise.all([
    supabase
      .from('matches')
      .select(
        `
          id,
          round_number,
          match_date,
          home_score,
          away_score,
          is_finished,
          home_team:teams!matches_home_team_id_fkey(id, name),
          away_team:teams!matches_away_team_id_fkey(id, name)
        `
      )
      .eq('tournament_id', tournamentId),
    // El perfil embebido se usa solo para descartar jugadores ocultos: sin eso,
    // la posición y el total de participantes no coinciden con los de la tabla.
    supabase
      .from('round_scores')
      .select('user_id, round_number, total_points, profiles (username, full_name)')
      .eq('tournament_id', tournamentId),
  ])

  if (matchesResult.error) throw matchesResult.error
  if (roundScoresResult.error) throw roundScoresResult.error

  const tournamentMatches = matchesResult.data || []
  const matchIds = tournamentMatches.map(match => match.id)

  if (matchIds.length === 0) return emptyStats

  const { data: predictionsData, error: predictionsError } = await supabase
    .from('predictions')
    .select('match_id, home_prediction, away_prediction, points')
    .eq('user_id', userId)
    .in('match_id', matchIds)

  if (predictionsError) throw predictionsError

  // Al usuario propio nunca se lo descarta, aunque esté en la lista de ocultos:
  // si no, su propia página se queda sin posición.
  const visibleRoundScores = (roundScoresResult.data || []).filter(
    score => String(score.user_id) === String(userId) || !isHiddenPlayer(score.profiles)
  )

  return buildTournamentStats(tournamentMatches, predictionsData || [], visibleRoundScores, userId)
}

export const usePersonalStats = (userId, tournamentId = null) => {
  const { data, isPending, error } = useQuery({
    queryKey: queryKeys.personalStats(tournamentId, userId),
    enabled: Boolean(userId),
    queryFn: async () => {
      if (tournamentId) return fetchTournamentStats(userId, tournamentId)

      const { data: rpcData, error: rpcError } = await supabase.rpc('get_personal_stats')

      if (rpcError) throw rpcError
      return normalizeStats(rpcData || {})
    },
  })

  return {
    stats: userId ? (data ?? null) : emptyStats,
    loading: Boolean(userId) && isPending,
    // El mensaje se mantiene genérico: el error crudo de Postgres no le dice
    // nada al usuario.
    error: error ? 'No se pudieron cargar las estadísticas personales' : null,
  }
}
