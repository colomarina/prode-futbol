/**
 * Qué fechas tienen tabla propia en la tabla de posiciones, y si el torneo tiene
 * playoffs como para mostrar su tabla agregada.
 *
 * El criterio sale de los partidos, no de `rounds.status`. El status se actualiza
 * a mano desde el panel de fechas y en la práctica queda desincronizado: en
 * Clausura 2026 la fecha 4 se jugó entera y quedó en `open`, y en Mundial 2026
 * las fechas de playoff siguen en `pending`. Filtrar por status hacía desaparecer
 * fechas ya jugadas del selector. Es el mismo criterio que usa
 * `getNextActiveRoundNumber` para derivar la fecha activa de los `match_date`.
 */

/**
 * Fechas que en el Mundial tienen tabla propia en vez de entrar en la tabla
 * agregada de playoffs: 16avos y octavos son demasiado grandes para mezclarlas
 * con cuartos a final.
 *
 * Solo aplica al torneo del Mundial. En una liga, una fecha de playoff entra en
 * la tabla agregada como cualquier otra.
 */
export const WORLD_CUP_STANDALONE_ROUNDS = new Set([4, 5])

/** Fechas con al menos un partido finalizado, o sea con puntos para mostrar. */
export function getPlayedRoundNumbers(matchesMeta = []) {
  return new Set(
    (matchesMeta || []).filter(match => match?.is_finished).map(match => match.round_number)
  )
}

/** Fechas de playoff, derivadas de `matches.is_playoff` y no de un rango fijo. */
export function getPlayoffRoundNumbers(matchesMeta = []) {
  return new Set(
    (matchesMeta || []).filter(match => match?.is_playoff).map(match => match.round_number)
  )
}

export function hasPlayoffMatches(matchesMeta = []) {
  return (matchesMeta || []).some(match => match?.is_playoff)
}

/**
 * Opciones de fecha del selector de la tabla de posiciones.
 *
 * @param {object} params
 * @param {Array} params.rounds Fechas del torneo (`useRounds`).
 * @param {Array} params.matchesMeta Partidos del torneo (`useMatchesMeta`).
 * @param {boolean} params.isWorldCupTournament
 * @returns {{individualRounds: Array, showPlayoffs: boolean}} `individualRounds`
 *   viene ordenado de la fecha más nueva a la más vieja, con un `id` igual al
 *   `round_number` para el dropdown.
 */
export function getLeaderboardRounds({
  rounds = [],
  matchesMeta = [],
  isWorldCupTournament = false,
} = {}) {
  const playedRounds = getPlayedRoundNumbers(matchesMeta)
  const playoffRounds = getPlayoffRoundNumbers(matchesMeta)
  const standaloneRounds = isWorldCupTournament ? WORLD_CUP_STANDALONE_ROUNDS : new Set()

  const individualRounds = (rounds || [])
    .filter(round => playedRounds.has(round.round_number))
    .filter(
      round => !playoffRounds.has(round.round_number) || standaloneRounds.has(round.round_number)
    )
    .sort((a, b) => b.round_number - a.round_number)
    .map(round => ({ ...round, id: round.round_number }))

  // La tabla agregada de playoffs suma las fechas de playoff que no tienen tabla
  // propia. Sin ninguna jugada la opción no aporta nada: la tabla sale vacía.
  const aggregatedPlayoffRounds = [...playoffRounds].filter(
    roundNumber => !standaloneRounds.has(roundNumber) && playedRounds.has(roundNumber)
  )

  return { individualRounds, showPlayoffs: aggregatedPlayoffRounds.length > 0 }
}
