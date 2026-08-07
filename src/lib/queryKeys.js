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
