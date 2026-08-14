/**
 * La forma completa del objeto de estadísticas, con todo en cero.
 *
 * Cumple dos roles: es lo que se muestra cuando no hay nada que mostrar, y es el
 * contrato que `normalizeStats` completa cuando los datos vienen de la RPC
 * `get_personal_stats` en vez de calcularse acá. La RPC devuelve un JSON que
 * puede tener campos de menos, y la pantalla lee `stats.metrics.totalPoints`
 * directo: sin rellenar, un campo faltante es un `undefined` en pantalla.
 *
 * La anotación `TournamentStats` es la que ata las dos puntas: si `types.ts` gana
 * un campo, este literal deja de compilar hasta que se lo agregue.
 */
import type { TournamentStats } from './types'

export const emptyStats: TournamentStats = {
  metrics: {
    totalPoints: 0,
    hitPercentage: 0,
    avgPerRound: 0,
    currentPosition: null,
    totalParticipants: 0,
  },
  evolutionByRound: [],
  positionByRound: [],
  streaks: {
    longestPointStreak: 0,
    longestPlenoStreak: 0,
    longestTop3Streak: 0,
    longestTop10Streak: 0,
  },
  bestRound: {
    roundNumber: null,
    points: 0,
  },
  worstRound: {
    roundNumber: null,
    points: 0,
  },
  accuracyBreakdown: {
    exactScores: 0,
    winnerHits: 0,
    bonusGoals: 0,
    totalAnalyzed: 0,
    goalDiffCorrect: 0,
    winnerOnly: 0,
    errors: 0,
  },
  additionalStats: {
    totalPredictions: 0,
    avgPointsPerMatch: 0,
    finishedMatches: 0,
  },
  teamStats: {
    favoriteTeam: null,
    bestReadTeam: null,
    worstReadTeam: null,
  },
  personalRecords: {
    bestMatch: null,
    mostPreciseRound: null,
  },
  history: {
    roundsWon: 0,
    podiums: 0,
    bestPosition: null,
    bestPositionRound: null,
    roundsImproved: 0,
  },
}

/**
 * Completa con ceros los campos que falten, respetando los grupos anidados: el
 * spread de arriba es plano, así que un `metrics` con la mitad de los campos
 * pisaría el default entero.
 *
 * Se aplica solo a la respuesta de la RPC, que es un JSON sin garantías: de ahí el
 * parámetro laxo. Lo que calcula `buildTournamentStats` ya viene completo por
 * construcción.
 *
 * Los siete grupos van escritos uno por uno en vez de recorrer una lista de
 * nombres, que es como estaba: con el índice dinámico TypeScript no puede
 * verificar que la clave y el valor sean del mismo grupo y hace falta un cast, y
 * un cast acá es justamente perder lo único que este módulo garantiza.
 */
export const normalizeStats = (
  stats: Partial<TournamentStats> | null | undefined
): TournamentStats => ({
  ...emptyStats,
  ...stats,
  metrics: { ...emptyStats.metrics, ...stats?.metrics },
  accuracyBreakdown: { ...emptyStats.accuracyBreakdown, ...stats?.accuracyBreakdown },
  additionalStats: { ...emptyStats.additionalStats, ...stats?.additionalStats },
  teamStats: { ...emptyStats.teamStats, ...stats?.teamStats },
  personalRecords: { ...emptyStats.personalRecords, ...stats?.personalRecords },
  history: { ...emptyStats.history, ...stats?.history },
  streaks: { ...emptyStats.streaks, ...stats?.streaks },
})
