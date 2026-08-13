/**
 * Posiciones del usuario a partir de `round_scores`.
 *
 * Todo el ordenamiento pasa por `utils/ranking.js`, que es la fuente única: si
 * este módulo desempatara por su cuenta, la posición de la pantalla de
 * estadísticas volvería a no coincidir con la de la tabla de posiciones. Ese fue
 * un bug real, arreglado en la fase 2 y cubierto por
 * `utils/ranking.consistencia.test.js`.
 *
 * Las filas que llegan acá ya vienen sin jugadores ocultos (lo filtra el hook),
 * salvo el usuario propio, que nunca se descarta.
 */
import { compareByPoints, assignPositions } from '../ranking'

const rankScores = scores =>
  assignPositions(
    scores
      .slice()
      .sort(
        compareByPoints(
          score => score.total_points,
          score => score.user_id
        )
      )
      .map(score => ({
        userId: String(score.user_id),
        totalPoints: Number(score.total_points || 0),
      }))
  )

/**
 * En qué puesto salió el usuario en cada fecha, ordenado por número de fecha.
 *
 * Solo aparecen las fechas en las que el usuario tiene fila en `round_scores`.
 * Una fecha donde no jugó no es un puesto último: no entra, y por lo tanto no
 * corta las rachas de top 3 / top 10.
 *
 * @returns {Array<{roundNumber: number, position: number, totalPoints: number}>}
 */
export const buildPositionHistory = (roundScores, userId) => {
  const scoresByRound = new Map()
  ;(roundScores || []).forEach(score => {
    const scores = scoresByRound.get(score.round_number) || []
    scores.push(score)
    scoresByRound.set(score.round_number, scores)
  })

  const userIdString = String(userId)

  return Array.from(scoresByRound.keys())
    .sort((a, b) => a - b)
    .map(roundNumber => {
      const ranked = rankScores(scoresByRound.get(roundNumber) || [])
      const entry = ranked.find(item => item.userId === userIdString)
      return entry
        ? { roundNumber, position: entry.position, totalPoints: entry.totalPoints }
        : null
    })
    .filter(Boolean)
}

/**
 * Tabla general: suma los puntos de todas las fechas por usuario y asigna
 * puestos. Es la misma agregación que hace `useLeaderboard` para la tabla
 * general, y tiene que dar el mismo resultado.
 *
 * @returns {Array<{userId: string, totalPoints: number, position: number}>}
 */
export const buildOverallRanking = roundScores => {
  const totalsByUser = new Map()
  ;(roundScores || []).forEach(score => {
    const userId = String(score.user_id)
    totalsByUser.set(userId, (totalsByUser.get(userId) || 0) + Number(score.total_points || 0))
  })

  return assignPositions(
    Array.from(totalsByUser.entries())
      .map(([userId, totalPoints]) => ({ userId, totalPoints }))
      .sort(
        compareByPoints(
          entry => entry.totalPoints,
          entry => entry.userId
        )
      )
  )
}

/**
 * Palmarés derivado del historial de posiciones.
 *
 * `roundsImproved` compara cada fecha con la **anterior del historial**, que no
 * es necesariamente la fecha inmediata anterior: si el usuario no jugó la fecha
 * 3, la 4 se compara contra la 2.
 *
 * @returns {{
 *   roundsWon: number,
 *   podiums: number,
 *   bestPosition: number|null,
 *   bestPositionRound: number|null,
 *   roundsImproved: number,
 * }}
 */
export const buildHistory = positionHistory => {
  const best = positionHistory.reduce(
    (mejor, entry) => (!mejor || entry.position < mejor.position ? entry : mejor),
    null
  )

  return {
    roundsWon: positionHistory.filter(entry => entry.position === 1).length,
    podiums: positionHistory.filter(entry => entry.position > 0 && entry.position <= 3).length,
    bestPosition: best ? best.position : null,
    bestPositionRound: best ? best.roundNumber : null,
    roundsImproved: positionHistory.reduce((count, entry, index) => {
      if (index === 0) return 0
      return positionHistory[index - 1].position > entry.position ? count + 1 : count
    }, 0),
  }
}
