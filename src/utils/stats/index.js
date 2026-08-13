/**
 * Composición de las estadísticas personales de un torneo.
 *
 * Todo lo que hay acá es puro: entran los partidos del torneo, los pronósticos
 * del usuario y las filas de `round_scores`, y sale el objeto que consume
 * `PersonalStats`. El fetching vive en `hooks/usePersonalStats.jsx`.
 *
 * Antes esto era un solo `buildTournamentStats` de 304 líneas con un `forEach`
 * que acumulaba en once variables a la vez. Cada módulo de esta carpeta se lleva
 * una de las preguntas que se hacía ese loop, y esta función solo las ordena y
 * arma la forma final. Que ahora sean varias pasadas sobre el mismo array no
 * cambia nada: son decenas de partidos, no miles.
 */
import { collectAnalyzedPredictions } from './analyzed'
import { buildAccuracyBreakdown, countScoringPredictions, sumPoints } from './accuracy'
import { buildRoundTotals } from './rounds'
import { buildTeamStats } from './teamReads'
import { buildPositionHistory, buildOverallRanking, buildHistory } from './positions'
import { buildStreaks } from './streaks'
import { findBestMatch } from './records'

export { emptyStats, normalizeStats } from './emptyStats'

/**
 * @param {Array<object>} matches partidos del torneo con los equipos embebidos
 * @param {Array<object>} predictions pronósticos del usuario en ese torneo
 * @param {Array<object>} roundScores filas de `round_scores` del torneo, ya sin jugadores ocultos
 * @param {string} userId
 */
export const buildTournamentStats = (matches, predictions, roundScores, userId) => {
  const { analyzedPredictions, finishedMatches } = collectAnalyzedPredictions(matches, predictions)

  const totalPoints = sumPoints(analyzedPredictions)
  const totalAnalyzed = analyzedPredictions.length
  const scoringPredictions = countScoringPredictions(analyzedPredictions)

  const { evolutionByRound, bestRound, worstRound, mostPreciseRound } =
    buildRoundTotals(analyzedPredictions)

  const positionHistory = buildPositionHistory(roundScores, userId)
  const currentPositionEntry = buildOverallRanking(roundScores).find(
    entry => entry.userId === String(userId)
  )

  return {
    metrics: {
      totalPoints,
      // El porcentaje se mide sobre pronósticos que **sumaron**, no sobre los que
      // acertaron el ganador: el bonus de goles puede dar puntos en un partido
      // mal leído y eso también es acierto para el usuario.
      hitPercentage:
        totalAnalyzed > 0 ? Number(((scoringPredictions / totalAnalyzed) * 100).toFixed(1)) : 0,
      // Divide por las fechas en las que pronosticó algo, no por las del torneo.
      avgPerRound: evolutionByRound.length > 0 ? totalPoints / evolutionByRound.length : 0,
      currentPosition: currentPositionEntry ? currentPositionEntry.position : null,
      totalParticipants: roundScores ? new Set(roundScores.map(score => score.user_id)).size : 0,
    },
    evolutionByRound,
    // El campo se llama `points` pero lleva la **posición**: el gráfico de
    // evolución es el mismo componente para las dos series y lee `points`.
    positionByRound: positionHistory.map(entry => ({
      roundNumber: entry.roundNumber,
      points: entry.position,
    })),
    streaks: buildStreaks(analyzedPredictions, positionHistory),
    bestRound,
    worstRound,
    accuracyBreakdown: buildAccuracyBreakdown(analyzedPredictions),
    additionalStats: {
      // Todos los pronósticos cargados, incluidos los de partidos sin terminar.
      totalPredictions: predictions?.length || 0,
      avgPointsPerMatch: totalAnalyzed > 0 ? totalPoints / totalAnalyzed : 0,
      // Partidos terminados del torneo, los haya pronosticado o no.
      finishedMatches: finishedMatches.length,
    },
    teamStats: buildTeamStats(analyzedPredictions),
    personalRecords: {
      bestMatch: findBestMatch(analyzedPredictions),
      mostPreciseRound,
    },
    history: buildHistory(positionHistory),
  }
}
