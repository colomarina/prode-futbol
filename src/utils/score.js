/**
 * Helpers de marcador, compartidos entre cargar un resultado y pronosticar.
 *
 * Estaban copiados literal en `MatchResult` y en `MatchPrediction`. Son lógica
 * pura, así que además se pueden testear sin montar nada.
 */

/**
 * El valor de un input de gol como número, o null si todavía no hay nada.
 *
 * El guard del vacío importa: `Number('')` devuelve 0, así que sin él un campo
 * en blanco se leería como cero goles.
 *
 * @returns {number|null}
 */
export const parseScoreValue = value => {
  if (value === '' || value === null || value === undefined) return null

  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

/**
 * Quién gana con ese marcador. Devuelve null si empatan o si falta un gol: en un
 * playoff el empate no define nada por sí solo, lo resuelve el clasificado.
 *
 * @returns {string|null} El id del equipo ganador.
 */
export const getWinnerTeamId = (homeScore, awayScore, match) => {
  if (homeScore === null || awayScore === null) return null
  if (homeScore > awayScore) return match.home_team_id
  if (awayScore > homeScore) return match.away_team_id

  return null
}
