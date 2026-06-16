export const PREDICTION_CUTOFF_MINUTES = 10
export const RESULT_LOAD_DELAY_HOURS = 2

export const canPredictMatch = matchDate => {
  const cutoff = new Date(new Date(matchDate).getTime() - PREDICTION_CUTOFF_MINUTES * 60 * 1000)
  return new Date() < cutoff
}

export const hasMatchStarted = matchDate => new Date() >= new Date(matchDate)

export const canLoadResult = matchDate => {
  const loadTime = new Date(
    new Date(matchDate).getTime() + RESULT_LOAD_DELAY_HOURS * 60 * 60 * 1000
  )
  return new Date() >= loadTime
}

export const secondsUntilCutoff = matchDate => {
  const cutoff = new Date(new Date(matchDate).getTime() - PREDICTION_CUTOFF_MINUTES * 60 * 1000)
  return Math.floor((cutoff - new Date()) / 1000)
}

export const getNextActiveRoundNumber = (rounds, matches) => {
  const now = new Date()
  const cutoffMs = PREDICTION_CUTOFF_MINUTES * 60 * 1000
  const predictableMatches = (matches || []).filter(
    match => new Date(match.match_date).getTime() - cutoffMs > now.getTime()
  )

  const predictableRoundNumbers = predictableMatches
    .map(m => Number(m.round_number))
    .filter(Number.isFinite)

  if (predictableRoundNumbers.length > 0) {
    return Math.min(...predictableRoundNumbers)
  }

  // No hay partidos predecibles: ir a la ronda más reciente con partido futuro
  const futureMatches = (matches || []).filter(match => new Date(match.match_date) > now)
  const futureRoundNumbers = futureMatches.map(m => Number(m.round_number)).filter(Number.isFinite)

  if (futureRoundNumbers.length > 0) {
    return Math.min(...futureRoundNumbers)
  }

  const allRoundNumbers = (rounds || [])
    .map(round => Number(round.round_number))
    .filter(Number.isFinite)

  if (allRoundNumbers.length > 0) {
    return Math.max(...allRoundNumbers)
  }

  return null
}
