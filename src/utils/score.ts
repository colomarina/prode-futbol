/**
 * Helpers de marcador, compartidos entre cargar un resultado y pronosticar.
 *
 * Estaban copiados literal en `MatchResult` y en `MatchPrediction`. Son lógica
 * pura, así que además se pueden testear sin montar nada.
 */
import type { Match, Uuid } from '../types/domain'

/** Lo que puede traer un input de gol: lo tipeado, lo guardado, o nada. */
type ScoreInputValue = string | number | null | undefined

/**
 * El valor de un input de gol como número, o null si todavía no hay nada.
 *
 * El guard del vacío importa: `Number('')` devuelve 0, así que sin él un campo
 * en blanco se leería como cero goles.
 */
export const parseScoreValue = (value: ScoreInputValue): number | null => {
  if (value === '' || value === null || value === undefined) return null

  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

/**
 * Quién gana con ese marcador. Devuelve null si empatan o si falta un gol: en un
 * playoff el empate no define nada por sí solo, lo resuelve el clasificado.
 *
 * Del partido solo necesita los dos equipos, así que pide eso y no un `Match`
 * entero: así sirve igual para un partido que viene de la base y para uno armado
 * en un test.
 */
export const getWinnerTeamId = (
  homeScore: number | null,
  awayScore: number | null,
  match: Pick<Match, 'home_team_id' | 'away_team_id'>
): Uuid | null => {
  if (homeScore === null || awayScore === null) return null
  if (homeScore > awayScore) return match.home_team_id
  if (awayScore > homeScore) return match.away_team_id

  return null
}
