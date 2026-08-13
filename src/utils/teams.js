/**
 * Resolver un equipo dentro de un partido, a partir de su id.
 *
 * Las dos funciones estaban duplicadas literal: `resolveTeamById` en `MatchCard`
 * y en `UserPredictionRow`, y `resolveTeamName` en `PlayoffMatch` y en
 * `MatchPrediction`. Son la misma pregunta con dos respuestas distintas —el
 * objeto o el nombre—, así que la segunda se apoya en la primera.
 */

/**
 * El equipo del partido que tiene ese id, o null si el id no es ninguno de los
 * dos (pasa en playoffs, cuando el cruce todavía no está definido).
 */
export const resolveTeamById = (teamId, match) => {
  if (!teamId || !match) return null
  if (teamId === match.home_team_id) return match.home_team
  if (teamId === match.away_team_id) return match.away_team

  return null
}

/**
 * El nombre del equipo, con texto para mostrar cuando falta el dato.
 *
 * Los fallbacks 'Local' y 'Visitante' importan: el id puede coincidir aunque el
 * equipo no venga embebido en la consulta, y ahí hace falta decir algo.
 */
export const resolveTeamName = (teamId, match) => {
  if (!teamId || !match) return 'Sin definir'

  const team = resolveTeamById(teamId, match)
  if (!team) return 'Sin definir'

  return team.name || (teamId === match.home_team_id ? 'Local' : 'Visitante')
}

/**
 * A quién le tocó clasificar según un pronóstico de playoff.
 *
 * Si el pronóstico no es empate, el ganador sale del marcador; el equipo elegido
 * a dedo solo cuenta cuando empatan.
 */
export const resolvePredictedQualifierTeam = (prediction, match) => {
  if (!prediction || !match?.is_playoff) return null

  const home = Number(prediction.home_prediction)
  const away = Number(prediction.away_prediction)

  if (home > away) return match.home_team
  if (away > home) return match.away_team

  return resolveTeamById(prediction.qualifier_prediction_id, match)
}
