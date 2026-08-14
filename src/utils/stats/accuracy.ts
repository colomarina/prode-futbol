/**
 * Clasificación de un pronóstico contra el resultado real.
 *
 * Ojo con qué es esto y qué no: **acá no se calculan los puntos.** Los puntos
 * los escribe Supabase en `predictions.points` (ver CLAUDE.md) y este módulo los
 * lee tal cual. Lo que sí se decide acá es en qué *categoría* cae cada
 * pronóstico para el desglose que muestra la pantalla de estadísticas.
 *
 * Estaba todo inline en un `forEach` de 70 líneas dentro de
 * `buildTournamentStats`, mezclado con las cuentas por equipo y por fecha, así
 * que la regla más importante del dominio no tenía un solo test.
 */
import type { Match, Prediction } from '../../types/domain'
import type {
  AccuracyBreakdown,
  AnalyzedPrediction,
  ClassifiedPrediction,
  Outcome,
  PredictionKind,
} from './types'

/**
 * Resultado de un partido desde el punto de vista del local.
 * `1` gana el local, `-1` gana el visitante, `0` empate.
 *
 * Con marcadores nulos (`Number(null) === 0`) devuelve empate, y con `NaN`
 * también, porque ninguna de las dos comparaciones se cumple. Es el
 * comportamiento que ya tenía: un partido marcado como terminado pero sin
 * marcador cargado cuenta como 0-0.
 */
export const getOutcome = (home: number, away: number): Outcome => {
  if (home > away) return 1
  if (home < away) return -1
  return 0
}

/**
 * Mínimo de goles totales para que corra el bonus de goles.
 *
 * El original decía `totalGoals > 2`. Es lo mismo con marcadores enteros —y lo
 * son, la columna es `smallint`— pero como umbral con nombre se lee.
 */
export const GOALS_BONUS_MIN_TOTAL = 3

/**
 * Las cuatro categorías posibles, en orden de mérito.
 *
 * El `satisfies` mantiene los valores como literales (`'exact'` y no `string`), que
 * es lo que hace que `PredictionKind` y este mapa no puedan desincronizarse.
 */
export const PREDICTION_KIND = {
  EXACT: 'exact',
  GOAL_DIFF: 'goalDiff',
  WINNER_ONLY: 'winnerOnly',
  ERROR: 'error',
} satisfies Record<string, PredictionKind>

/** Del partido y del pronóstico solo se leen los marcadores y los puntos. */
type MarcadorReal = Pick<Match, 'home_score' | 'away_score'>
type MarcadorPronosticado = Pick<Prediction, 'home_prediction' | 'away_prediction' | 'points'>

export const classifyPrediction = (
  match: MarcadorReal,
  prediction: MarcadorPronosticado
): ClassifiedPrediction => {
  const actualHome = Number(match.home_score)
  const actualAway = Number(match.away_score)
  const predictedHome = Number(prediction.home_prediction)
  const predictedAway = Number(prediction.away_prediction)

  const actualOutcome = getOutcome(actualHome, actualAway)
  const predictedOutcome = getOutcome(predictedHome, predictedAway)
  const points = Number(prediction.points || 0)

  const isExact = predictedHome === actualHome && predictedAway === actualAway

  let kind: PredictionKind = PREDICTION_KIND.ERROR
  if (isExact) {
    kind = PREDICTION_KIND.EXACT
  } else if (actualOutcome === predictedOutcome) {
    // Acertó quién ganaba. Queda distinguir si además acertó por cuánto.
    kind =
      actualHome - actualAway === predictedHome - predictedAway
        ? PREDICTION_KIND.GOAL_DIFF
        : PREDICTION_KIND.WINNER_ONLY
  }

  const actualTotalGoals = actualHome + actualAway

  return {
    kind,
    points,
    // "Sumó algo" no es lo mismo que "acertó el ganador": el bonus de goles
    // puede dar puntos en un partido mal leído. Por eso el porcentaje de acierto
    // se mide con esto y no con `kind`.
    scored: points > 0,
    hitsGoalsBonus:
      actualTotalGoals >= GOALS_BONUS_MIN_TOTAL &&
      predictedHome + predictedAway === actualTotalGoals,
    actualOutcome,
    predictedOutcome,
  }
}

/**
 * Desglose de aciertos sobre todos los pronósticos analizados.
 *
 * `winnerHits` es la suma de las dos categorías intermedias porque la pantalla
 * muestra "acertó el ganador" como un solo número, pero el desglose fino se
 * sigue exponiendo aparte.
 */
export const buildAccuracyBreakdown = (
  analyzedPredictions: AnalyzedPrediction[]
): AccuracyBreakdown => {
  let exactScores = 0
  let goalDiffCorrect = 0
  let winnerOnly = 0
  let errors = 0
  let bonusGoals = 0

  analyzedPredictions.forEach(({ match, prediction }) => {
    const { kind, hitsGoalsBonus } = classifyPrediction(match, prediction)

    if (hitsGoalsBonus) bonusGoals += 1

    if (kind === PREDICTION_KIND.EXACT) exactScores += 1
    else if (kind === PREDICTION_KIND.GOAL_DIFF) goalDiffCorrect += 1
    else if (kind === PREDICTION_KIND.WINNER_ONLY) winnerOnly += 1
    else errors += 1
  })

  return {
    exactScores,
    winnerHits: goalDiffCorrect + winnerOnly,
    bonusGoals,
    totalAnalyzed: analyzedPredictions.length,
    goalDiffCorrect,
    winnerOnly,
    errors,
  }
}

/**
 * Cuántos pronósticos sumaron puntos. Va aparte del desglose porque no forma
 * parte de lo que muestra la tarjeta: alimenta el porcentaje de acierto.
 */
export const countScoringPredictions = (analyzedPredictions: AnalyzedPrediction[]): number =>
  analyzedPredictions.filter(
    ({ match, prediction }) => classifyPrediction(match, prediction).scored
  ).length

/**
 * Puntos totales de los pronósticos analizados.
 *
 * Pasa por `classifyPrediction` en vez de leer `prediction.points` a mano para
 * que la conversión de nulos (`Number(null) === 0`) sea la misma en todos los
 * cálculos. Es el número del que cuelgan el total, el promedio por fecha y el
 * promedio por partido.
 */
export const sumPoints = (analyzedPredictions: AnalyzedPrediction[]): number =>
  analyzedPredictions.reduce(
    (total, { match, prediction }) => total + classifyPrediction(match, prediction).points,
    0
  )
