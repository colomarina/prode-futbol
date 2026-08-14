import type { IsoDate, Match, Round } from '../types/domain'

export const PREDICTION_CUTOFF_MINUTES = 10
export const RESULT_LOAD_DELAY_HOURS = 2

const MINUTO_MS = 60 * 1000

/** El instante en que se cierra el pronóstico de un partido. */
const getCutoffTime = (matchDate: IsoDate): number =>
  new Date(matchDate).getTime() - PREDICTION_CUTOFF_MINUTES * MINUTO_MS

export const canPredictMatch = (matchDate: IsoDate): boolean =>
  Date.now() < getCutoffTime(matchDate)

export const hasMatchStarted = (matchDate: IsoDate): boolean => new Date() >= new Date(matchDate)

/**
 * Momento a partir del cual el admin puede cargar el resultado.
 * Existe para que la UI no reimplemente el calculo del delay: si se cambia
 * RESULT_LOAD_DELAY_HOURS, el texto que ve el admin tiene que cambiar con el.
 */
export const getResultLoadTime = (matchDate: IsoDate): Date =>
  new Date(new Date(matchDate).getTime() + RESULT_LOAD_DELAY_HOURS * 60 * MINUTO_MS)

export const canLoadResult = (matchDate: IsoDate): boolean =>
  new Date() >= getResultLoadTime(matchDate)

export const secondsUntilCutoff = (matchDate: IsoDate): number =>
  Math.floor((getCutoffTime(matchDate) - Date.now()) / 1000)

/**
 * Number(null), Number(undefined) y Number('') devuelven 0 o NaN de forma
 * inconsistente, y Number.isFinite(0) es true: sin este guard un round_number
 * nulo se colaba como "fecha 0" y ganaba cualquier Math.min.
 */
const toRoundNumber = (value: number | string | null | undefined): number | null => {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const isNotNull = (value: number | null): value is number => value !== null

/**
 * De qué fecha se pronostica ahora, derivado de los `match_date` y no de
 * `rounds.status`, que se actualiza a mano y queda desincronizado.
 *
 * Los dos parámetros piden solo las columnas que usan: así los acepta tanto la
 * lista completa de `useRounds` como el subconjunto que trae `useMatchesMeta`.
 */
export const getNextActiveRoundNumber = (
  rounds: Pick<Round, 'round_number'>[] | null | undefined,
  matches: Pick<Match, 'round_number' | 'match_date'>[] | null | undefined
): number | null => {
  const now = new Date()
  const cutoffMs = PREDICTION_CUTOFF_MINUTES * MINUTO_MS
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
