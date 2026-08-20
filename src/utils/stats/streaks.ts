/**
 * Rachas: la tira más larga de aciertos consecutivos.
 *
 * Las cuatro rachas se cuentan sobre **dos secuencias distintas**, y confundirlas
 * daría números mal:
 *
 *   - las de puntos y de pleno recorren los pronósticos analizados, o sea van
 *     partido por partido en orden de fecha de juego;
 *   - las de top 3 y top 10 recorren el historial de posiciones, o sea van fecha
 *     por fecha del torneo.
 *
 * En las dos, "no participó" no corta la racha: los elementos que no existen en
 * la secuencia simplemente no están (ver `analyzed.ts` y `positions.ts`).
 */
import { classifyPrediction, PREDICTION_KIND } from './accuracy'
import type { AnalyzedPrediction, PositionHistoryEntry, Streaks } from './types'

/** Tira más larga de elementos consecutivos que cumplen el predicado. */
export const getLongestConsecutive = <T>(items: T[], predicate: (item: T) => boolean): number => {
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

/** Hasta qué puesto cuenta como podio y como top para las rachas. */
export const PODIUM_LIMIT = 3
export const TOP_LIMIT = 10

/**
 * @param analyzedPredictions en orden de fecha de juego
 * @param positionHistory en orden de número de fecha
 */
export const buildStreaks = (
  analyzedPredictions: AnalyzedPrediction[],
  positionHistory: PositionHistoryEntry[]
): Streaks => ({
  longestPointStreak: getLongestConsecutive(
    analyzedPredictions,
    ({ match, prediction }) => classifyPrediction(match, prediction).scored
  ),
  longestPlenoStreak: getLongestConsecutive(
    analyzedPredictions,
    ({ match, prediction }) => classifyPrediction(match, prediction).kind === PREDICTION_KIND.EXACT
  ),
  longestTop3Streak: getLongestConsecutive(
    positionHistory,
    entry => entry.position <= PODIUM_LIMIT
  ),
  longestTop10Streak: getLongestConsecutive(positionHistory, entry => entry.position <= TOP_LIMIT),
})
