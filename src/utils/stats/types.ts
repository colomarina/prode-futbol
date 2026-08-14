/**
 * El contrato de las estadísticas personales.
 *
 * Hasta ahora era implícito: la forma la definía el literal `emptyStats` y la
 * pantalla leía `stats.metrics.totalPoints` de memoria. Como el mismo objeto llega
 * por dos caminos —calculado acá o traído de la RPC `get_personal_stats`—, tenerlo
 * escrito es lo que permite que `normalizeStats` garantice algo.
 *
 * Todos los tipos que abren con `Round*` o terminan en `Entry` son intermedios: no
 * salen de la base ni llegan a la pantalla, viven entre los módulos de esta
 * carpeta.
 */
import type { MatchWithTeams, Prediction } from '../../types/domain'

/**
 * Un partido terminado junto con el pronóstico que el usuario cargó para él. Es
 * la entrada de **todos** los cálculos de esta carpeta.
 */
export interface AnalyzedPrediction {
  match: MatchWithTeams
  prediction: Prediction
}

/** Resultado visto desde el local: 1 gana local, -1 gana visitante, 0 empate. */
export type Outcome = 1 | -1 | 0

/** Las cuatro categorías en que puede caer un pronóstico, en orden de mérito. */
export type PredictionKind = 'exact' | 'goalDiff' | 'winnerOnly' | 'error'

export interface ClassifiedPrediction {
  kind: PredictionKind
  points: number
  /** Sumó puntos, que no es lo mismo que acertar el ganador: existe el bonus de goles. */
  scored: boolean
  hitsGoalsBonus: boolean
  actualOutcome: Outcome
  predictedOutcome: Outcome
}

export interface AccuracyBreakdown {
  exactScores: number
  /** La suma de `goalDiffCorrect` y `winnerOnly`: la pantalla lo muestra junto. */
  winnerHits: number
  bonusGoals: number
  totalAnalyzed: number
  goalDiffCorrect: number
  winnerOnly: number
  errors: number
}

/** Puntos de una fecha. `roundNumber` es null solo en el caso vacío. */
export interface RoundPoints {
  roundNumber: number | null
  points: number
}

export interface RoundPrecision {
  roundNumber: number
  percentage: number
}

export interface RoundTotals {
  evolutionByRound: RoundPoints[]
  bestRound: RoundPoints
  worstRound: RoundPoints
  mostPreciseRound: RoundPrecision | null
}

/** Un puesto del usuario en una fecha. Las fechas que no jugó no aparecen. */
export interface PositionHistoryEntry {
  roundNumber: number
  position: number
  totalPoints: number
}

/** Una fila de la tabla general agregada por usuario. */
export interface RankingEntry {
  userId: string
  totalPoints: number
  position: number
}

export interface Streaks {
  longestPointStreak: number
  longestPlenoStreak: number
  longestTop3Streak: number
  longestTop10Streak: number
}

export interface FavoriteTeam {
  name: string
  count: number
}

export interface TeamRead {
  name: string
  percentage: number
  matches: number
}

export interface TeamStats {
  favoriteTeam: FavoriteTeam | null
  bestReadTeam: TeamRead | null
  worstReadTeam: TeamRead | null
}

/** El mejor pronóstico del torneo, con el partido para poder mostrarlo. */
export interface BestMatchRecord {
  match: MatchWithTeams
  prediction: Prediction
  points: number
}

export interface StatsHistory {
  roundsWon: number
  podiums: number
  bestPosition: number | null
  bestPositionRound: number | null
  roundsImproved: number
}

/** El objeto completo que consume `PersonalStats`. */
export interface TournamentStats {
  metrics: {
    totalPoints: number
    hitPercentage: number
    avgPerRound: number
    currentPosition: number | null
    totalParticipants: number
  }
  evolutionByRound: RoundPoints[]
  /**
   * El campo se llama `points` pero lleva la **posición**: el gráfico de evolución
   * es el mismo componente para las dos series y lee `points`.
   */
  positionByRound: RoundPoints[]
  streaks: Streaks
  bestRound: RoundPoints
  worstRound: RoundPoints
  accuracyBreakdown: AccuracyBreakdown
  additionalStats: {
    totalPredictions: number
    avgPointsPerMatch: number
    finishedMatches: number
  }
  teamStats: TeamStats
  personalRecords: {
    bestMatch: BestMatchRecord | null
    mostPreciseRound: RoundPrecision | null
  }
  history: StatsHistory
}
