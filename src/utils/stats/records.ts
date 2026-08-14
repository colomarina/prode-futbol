import { classifyPrediction } from './accuracy'
import type { AnalyzedPrediction, BestMatchRecord } from './types'

/**
 * El pronóstico que más puntos dio en todo el torneo.
 *
 * Ante empate gana el más antiguo, porque `analyzedPredictions` viene ordenado
 * por fecha de juego y la comparación es estrictamente mayor. Es un récord
 * personal: tiene sentido que sea la primera vez que lo logró.
 */
export const findBestMatch = (analyzedPredictions: AnalyzedPrediction[]): BestMatchRecord | null =>
  analyzedPredictions.reduce<BestMatchRecord | null>((best, { match, prediction }) => {
    const { points } = classifyPrediction(match, prediction)
    return !best || points > best.points ? { match, prediction, points } : best
  }, null)
