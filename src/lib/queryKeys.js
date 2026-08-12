/**
 * Query keys de React Query. **Todas empiezan por el id del torneo.**
 *
 * Ese prefijo no es cosmético: es lo que garantiza que los datos no se mezclen
 * entre torneos. Los `round_number` se repiten de un torneo a otro, así que una
 * key sin torneo haría que el cache de la fecha 3 de un torneo se sirviera como
 * la fecha 3 de otro. Reemplaza al guard manual que había en cada hook.
 *
 * `?? null` normaliza undefined a null para que `['rounds', undefined]` y
 * `['rounds', null]` no sean dos entradas distintas del cache.
 */
export const queryKeys = {
  /** Todo lo de un torneo, para invalidar de una. */
  tournament: tournamentId => [tournamentId ?? null],

  /** Fechas del torneo. */
  rounds: tournamentId => [tournamentId ?? null, 'rounds'],

  /**
   * Datos mínimos de todos los partidos del torneo (id, fecha, número de fecha,
   * si terminó). Es la query que antes se repetía en `useRounds`, `MatchManager`,
   * `RoundManager` y `useAllPredictions`, cada uno con su propio select.
   */
  matchesMeta: tournamentId => [tournamentId ?? null, 'matches', 'meta'],

  /** Partidos completos de una fecha, con los equipos embebidos. */
  matchesByRound: (tournamentId, roundNumber) => [
    tournamentId ?? null,
    'matches',
    'round',
    roundNumber ?? null,
  ],

  /** Pronósticos del usuario para una fecha. */
  predictions: (tournamentId, roundNumber, userId) => [
    tournamentId ?? null,
    'predictions',
    'round',
    roundNumber ?? null,
    userId ?? null,
  ],

  /** Pronósticos de otro jugador en una fecha (vista "todas las predicciones"). */
  predictionsOfUserInRound: (tournamentId, roundNumber, userId) => [
    tournamentId ?? null,
    'predictions',
    'by-user',
    roundNumber ?? null,
    userId || null,
  ],

  /** Pronósticos de todos los jugadores para un partido. */
  predictionsByMatch: (tournamentId, matchId) => [
    tournamentId ?? null,
    'predictions',
    'by-match',
    matchId ?? null,
  ],

  /** Perfiles de los jugadores. No depende del torneo. */
  profiles: () => ['profiles'],

  /** Tabla de posiciones: general, de una fecha, o de playoffs. */
  leaderboard: (tournamentId, roundNumber, isWorldCupTournament) => [
    tournamentId ?? null,
    'leaderboard',
    roundNumber ?? null,
    Boolean(isWorldCupTournament),
  ],

  /** Estadísticas personales del usuario en el torneo. */
  personalStats: (tournamentId, userId) => [tournamentId ?? null, 'personal-stats', userId ?? null],

  /** Bonus del Mundial: configuración, equipos, resultados y pronósticos. */
  worldCupBonus: (tournamentId, userId) => [
    tournamentId ?? null,
    'world-cup-bonus',
    userId ?? null,
  ],

  /** Partidos de playoffs con sus equipos. */
  playoffMatches: tournamentId => [tournamentId ?? null, 'matches', 'playoffs'],

  /** Pronósticos de playoffs del usuario. */
  playoffPredictions: (tournamentId, userId) => [
    tournamentId ?? null,
    'predictions',
    'playoffs',
    userId ?? null,
  ],
}
