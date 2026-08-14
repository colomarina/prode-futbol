import { classifyPrediction } from './accuracy'

/**
 * El pronóstico que más puntos dio en todo el torneo.
 *
 * Ante empate gana el más antiguo, porque `analyzedPredictions` viene ordenado
 * por fecha de juego y la comparación es estrictamente mayor. Es un récord
 * personal: tiene sentido que sea la primera vez que lo logró.
 *
 * @param {Array<{match: object, prediction: object}>} analyzedPredictions
 * @returns {{match: object, prediction: object, points: number}|null}
 */
export const findBestMatch = analyzedPredictions =>
  analyzedPredictions.reduce((best, { match, prediction }) => {
    const { points } = classifyPrediction(match, prediction)
    return !best || points > best.points ? { match, prediction, points } : best
  }, null)
