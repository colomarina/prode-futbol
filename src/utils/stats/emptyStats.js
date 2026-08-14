/**
 * La forma completa del objeto de estadísticas, con todo en cero.
 *
 * Cumple dos roles: es lo que se muestra cuando no hay nada que mostrar, y es el
 * contrato que `normalizeStats` completa cuando los datos vienen de la RPC
 * `get_personal_stats` en vez de calcularse acá. La RPC devuelve un JSON que
 * puede tener campos de menos, y la pantalla lee `stats.metrics.totalPoints`
 * directo: sin rellenar, un campo faltante es un `undefined` en pantalla.
 */
export const emptyStats = {
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

/** Los grupos anidados, que hay que completar uno por uno: el spread es plano. */
const NESTED_GROUPS = [
  'metrics',
  'accuracyBreakdown',
  'additionalStats',
  'teamStats',
  'personalRecords',
  'history',
  'streaks',
]

/**
 * Completa con ceros los campos que falten, respetando los grupos anidados.
 *
 * Se aplica solo a la respuesta de la RPC. Lo que calcula `buildTournamentStats`
 * ya viene completo por construcción.
 */
export const normalizeStats = stats => {
  const normalized = { ...emptyStats, ...stats }

  NESTED_GROUPS.forEach(group => {
    normalized[group] = { ...emptyStats[group], ...(stats?.[group] || {}) }
  })

  return normalized
}
