/**
 * Agregaciones por fecha: cuántos puntos hizo el usuario en cada una y en cuál
 * tuvo mejor puntería.
 *
 * Son dos cuentas distintas sobre la misma partición y por eso viven juntas:
 * `evolutionByRound` suma **puntos**, `mostPreciseRound` mide **proporción de
 * pronósticos que sumaron**. Una fecha con muchos partidos puede ganar la
 * primera y perder la segunda.
 */
import { classifyPrediction } from './accuracy'

/**
 * @param {Array<{match: object, prediction: object}>} analyzedPredictions
 * @returns {{
 *   evolutionByRound: Array<{roundNumber: number, points: number}>,
 *   bestRound: {roundNumber: number|null, points: number},
 *   worstRound: {roundNumber: number|null, points: number},
 *   mostPreciseRound: {roundNumber: number, percentage: number}|null,
 * }}
 */
export const buildRoundTotals = analyzedPredictions => {
  const pointsByRound = new Map()
  const hitsByRound = new Map()

  analyzedPredictions.forEach(({ match, prediction }) => {
    const { points, scored } = classifyPrediction(match, prediction)
    const roundNumber = match.round_number

    pointsByRound.set(roundNumber, (pointsByRound.get(roundNumber) || 0) + points)

    const hits = hitsByRound.get(roundNumber) || { roundNumber, correct: 0, total: 0 }
    hits.total += 1
    if (scored) hits.correct += 1
    hitsByRound.set(roundNumber, hits)
  })

  const evolutionByRound = Array.from(pointsByRound.entries())
    .map(([roundNumber, points]) => ({ roundNumber, points }))
    .sort((a, b) => a.roundNumber - b.roundNumber)

  const emptyRound = { roundNumber: null, points: 0 }

  // Los `reduce` sin valor inicial arrancan del primer elemento, y como el array
  // ya viene ordenado por fecha, ante empate de puntos gana la fecha más
  // temprana. Es el criterio que la pantalla venía mostrando.
  const bestRound =
    evolutionByRound.length > 0
      ? evolutionByRound.reduce((best, round) => (round.points > best.points ? round : best))
      : emptyRound

  const worstRound =
    evolutionByRound.length > 0
      ? evolutionByRound.reduce((worst, round) => (round.points < worst.points ? round : worst))
      : emptyRound

  const mostPreciseRound =
    Array.from(hitsByRound.values())
      .filter(hits => hits.total > 0)
      .map(hits => ({
        roundNumber: hits.roundNumber,
        percentage: Number(((hits.correct / hits.total) * 100).toFixed(1)),
      }))
      // A igual porcentaje gana la fecha más temprana, igual que arriba.
      .sort((a, b) => b.percentage - a.percentage || a.roundNumber - b.roundNumber)[0] ?? null

  return {
    evolutionByRound,
    bestRound: { roundNumber: bestRound.roundNumber, points: bestRound.points },
    worstRound: { roundNumber: worstRound.roundNumber, points: worstRound.points },
    mostPreciseRound,
  }
}
