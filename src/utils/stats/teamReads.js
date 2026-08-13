/**
 * Cómo le va al usuario con cada equipo: a quién le apuesta más y a quién lee
 * mejor y peor.
 *
 * Son tres preguntas sobre la misma tabla de registros por equipo, pero **no se
 * miden sobre la misma población**. El equipo favorito sale de a quién elige
 * como ganador; el mejor y el peor leído salen de qué proporción de partidos de
 * ese equipo le dieron puntos. Un equipo puede aparecer en la primera sin
 * aparecer en las otras dos (ver el comentario de `matches` más abajo).
 */
import { classifyPrediction } from './accuracy'

/**
 * Debajo de esta cantidad de partidos el porcentaje de acierto no dice nada: con
 * un solo partido acertado un equipo sale 100% y gana el podio.
 */
export const MIN_TEAM_PREDICTIONS = 3

const getTeamRecord = (records, team) => {
  if (!team?.id) return null

  const existing = records.get(team.id)
  if (existing) return existing

  const record = { team, matches: 0, correctMatches: 0, predictedWinnerCount: 0 }
  records.set(team.id, record)
  return record
}

/**
 * Acumula un registro por equipo recorriendo los pronósticos analizados.
 *
 * `matches` solo se incrementa cuando el partido tiene **los dos** equipos
 * embebidos, mientras que `predictedWinnerCount` alcanza con el equipo del lado
 * elegido. La diferencia importa en el Mundial: los partidos de playoff existen
 * antes de saber quién los juega, así que uno puede tener `home_team` cargado y
 * `away_team` en null. Ese equipo entra en la cuenta de favoritos con
 * `matches: 0`, y por eso el favorito no se filtra por cantidad de partidos.
 */
const buildTeamRecords = analyzedPredictions => {
  const records = new Map()

  analyzedPredictions.forEach(({ match, prediction }) => {
    const { scored, predictedOutcome } = classifyPrediction(match, prediction)

    if (match.home_team && match.away_team) {
      ;[match.home_team, match.away_team].forEach(team => {
        const record = getTeamRecord(records, team)
        if (!record) return
        record.matches += 1
        if (scored) record.correctMatches += 1
      })
    }

    const predictedWinner =
      (predictedOutcome === 1 && match.home_team) ||
      (predictedOutcome === -1 && match.away_team) ||
      null

    if (predictedWinner) {
      const record = getTeamRecord(records, predictedWinner)
      if (record) record.predictedWinnerCount += 1
    }
  })

  return Array.from(records.values())
}

const accuracyOf = record => record.correctMatches / record.matches

const asPercentage = record =>
  record
    ? {
        name: record.team.name,
        percentage: Number((accuracyOf(record) * 100).toFixed(1)),
        matches: record.matches,
      }
    : null

/**
 * @param {Array<{match: object, prediction: object}>} analyzedPredictions
 * @returns {{
 *   favoriteTeam: {name: string, count: number}|null,
 *   bestReadTeam: {name: string, percentage: number, matches: number}|null,
 *   worstReadTeam: {name: string, percentage: number, matches: number}|null,
 * }}
 */
export const buildTeamStats = analyzedPredictions => {
  const records = buildTeamRecords(analyzedPredictions)

  const favoriteTeam = records.reduce(
    (best, record) =>
      !best || record.predictedWinnerCount > best.predictedWinnerCount ? record : best,
    null
  )

  // Si ningún equipo llega al mínimo se muestra igual el mejor y el peor de los
  // que haya, con el `matches` a la vista para que se entienda la muestra.
  const confiables = records.filter(record => record.matches >= MIN_TEAM_PREDICTIONS)
  const candidatos =
    confiables.length > 0 ? confiables : records.filter(record => record.matches > 0)

  const bestReadTeam = candidatos.reduce(
    (best, record) => (!best || accuracyOf(record) > accuracyOf(best) ? record : best),
    null
  )

  const worstReadTeam = candidatos.reduce(
    (worst, record) => (!worst || accuracyOf(record) < accuracyOf(worst) ? record : worst),
    null
  )

  return {
    favoriteTeam: favoriteTeam
      ? { name: favoriteTeam.team.name, count: favoriteTeam.predictedWinnerCount }
      : null,
    bestReadTeam: asPercentage(bestReadTeam),
    worstReadTeam: asPercentage(worstReadTeam),
  }
}
