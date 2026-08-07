export const PREDICTION_CUTOFF_MINUTES = 10
export const RESULT_LOAD_DELAY_HOURS = 2

export const canPredictMatch = matchDate => {
  const cutoff = new Date(new Date(matchDate).getTime() - PREDICTION_CUTOFF_MINUTES * 60 * 1000)
  return new Date() < cutoff
}

export const hasMatchStarted = matchDate => new Date() >= new Date(matchDate)

/**
 * Momento a partir del cual el admin puede cargar el resultado.
 * Existe para que la UI no reimplemente el calculo del delay: si se cambia
 * RESULT_LOAD_DELAY_HOURS, el texto que ve el admin tiene que cambiar con el.
 * @returns {Date}
 */
export const getResultLoadTime = matchDate =>
  new Date(new Date(matchDate).getTime() + RESULT_LOAD_DELAY_HOURS * 60 * 60 * 1000)

export const canLoadResult = matchDate => new Date() >= getResultLoadTime(matchDate)

export const secondsUntilCutoff = matchDate => {
  const cutoff = new Date(new Date(matchDate).getTime() - PREDICTION_CUTOFF_MINUTES * 60 * 1000)
  return Math.floor((cutoff - new Date()) / 1000)
}

/**
 * Number(null), Number(undefined) y Number('') devuelven 0 o NaN de forma
 * inconsistente, y Number.isFinite(0) es true: sin este guard un round_number
 * nulo se colaba como "fecha 0" y ganaba cualquier Math.min.
 * @returns {number|null}
 */
const toRoundNumber = value => {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const isNotNull = value => value !== null

export const getNextActiveRoundNumber = (rounds, matches) => {
  const now = new Date()
  const cutoffMs = PREDICTION_CUTOFF_MINUTES * 60 * 1000
  const predictableMatches = (matches || []).filter(
    match => new Date(match.match_date).getTime() - cutoffMs > now.getTime()
  )

  const predictableRoundNumbers = predictableMatches
    .map(m => toRoundNumber(m.round_number))
    .filter(isNotNull)

  if (predictableRoundNumbers.length > 0) {
    return Math.min(...predictableRoundNumbers)
  }

  // No hay partidos predecibles: ir a la ronda más reciente con partido futuro
  const futureMatches = (matches || []).filter(match => new Date(match.match_date) > now)
  const futureRoundNumbers = futureMatches.map(m => toRoundNumber(m.round_number)).filter(isNotNull)

  if (futureRoundNumbers.length > 0) {
    return Math.min(...futureRoundNumbers)
  }

  const allRoundNumbers = (rounds || [])
    .map(round => toRoundNumber(round.round_number))
    .filter(isNotNull)

  if (allRoundNumbers.length > 0) {
    return Math.max(...allRoundNumbers)
  }

  return null
}
