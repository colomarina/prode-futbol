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
import type { Uuid } from '../types/domain'

/** Los ids llegan como `undefined` mientras el contexto todavía no resolvió. */
type TournamentId = Uuid | null | undefined
type UserId = Uuid | null | undefined
type MatchId = Uuid | null | undefined
type RoundNumber = number | null | undefined

/**
 * La fecha en la tabla de posiciones no es solo un número: `null` es la tabla
 * general y `'playoffs'` la agregada de la llave (ver `useLeaderboard`).
 */
type LeaderboardRound = RoundNumber | 'playoffs'

export const queryKeys = {
  /** Todo lo de un torneo, para invalidar de una. */
  tournament: (tournamentId: TournamentId) => [tournamentId ?? null],

  /** Fechas del torneo. */
  rounds: (tournamentId: TournamentId) => [tournamentId ?? null, 'rounds'],

  /**
   * Datos mínimos de todos los partidos del torneo (id, fecha, número de fecha,
   * si terminó). Es la query que antes se repetía en `useRounds`, `MatchManager`,
   * `RoundManager` y `useAllPredictions`, cada uno con su propio select.
   */
  matchesMeta: (tournamentId: TournamentId) => [tournamentId ?? null, 'matches', 'meta'],

  /** Partidos completos de una fecha, con los equipos embebidos. */
  matchesByRound: (tournamentId: TournamentId, roundNumber: RoundNumber) => [
    tournamentId ?? null,
    'matches',
    'round',
    roundNumber ?? null,
  ],

  /** Pronósticos del usuario para una fecha. */
  predictions: (tournamentId: TournamentId, roundNumber: RoundNumber, userId: UserId) => [
    tournamentId ?? null,
    'predictions',
    'round',
    roundNumber ?? null,
    userId ?? null,
  ],

  /** Pronósticos de otro jugador en una fecha (vista "todas las predicciones"). */
  predictionsOfUserInRound: (
    tournamentId: TournamentId,
    roundNumber: RoundNumber,
    userId: UserId
  ) => [tournamentId ?? null, 'predictions', 'by-user', roundNumber ?? null, userId || null],

  /** Pronósticos de todos los jugadores para un partido. */
  predictionsByMatch: (tournamentId: TournamentId, matchId: MatchId) => [
    tournamentId ?? null,
    'predictions',
    'by-match',
    matchId ?? null,
  ],

  /** Perfiles de los jugadores. No depende del torneo. */
  profiles: () => ['profiles'],

  /** Tabla de posiciones: general, de una fecha, o de playoffs. */
  leaderboard: (
    tournamentId: TournamentId,
    roundNumber: LeaderboardRound,
    isWorldCupTournament?: boolean
  ) => [tournamentId ?? null, 'leaderboard', roundNumber ?? null, Boolean(isWorldCupTournament)],

  /** Estadísticas personales del usuario en el torneo. */
  personalStats: (tournamentId: TournamentId, userId: UserId) => [
    tournamentId ?? null,
    'personal-stats',
    userId ?? null,
  ],

  /** Cuánto pronosticó cada jugador en una fecha (panel de fechas del admin). */
  roundProgress: (tournamentId: TournamentId, roundNumber: RoundNumber) => [
    tournamentId ?? null,
    'round-progress',
    roundNumber ?? null,
  ],

  /** Bonus del Mundial: configuración, equipos, resultados y pronósticos. */
  worldCupBonus: (tournamentId: TournamentId, userId: UserId) => [
    tournamentId ?? null,
    'world-cup-bonus',
    userId ?? null,
  ],

  /** Partidos de playoffs con sus equipos. */
  playoffMatches: (tournamentId: TournamentId) => [tournamentId ?? null, 'matches', 'playoffs'],

  /** Pronósticos de playoffs del usuario. */
  playoffPredictions: (tournamentId: TournamentId, userId: UserId) => [
    tournamentId ?? null,
    'predictions',
    'playoffs',
    userId ?? null,
  ],
}
