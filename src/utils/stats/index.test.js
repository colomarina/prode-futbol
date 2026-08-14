import { describe, it, expect } from 'vitest'
import { buildTournamentStats, emptyStats, normalizeStats } from './index'

const BOCA = { id: 1, name: 'Boca' }
const RIVER = { id: 2, name: 'River' }
const TIGRE = { id: 3, name: 'Tigre' }

// Un torneo mínimo pero completo: dos fechas, un partido sin terminar, un
// pronóstico que erra el ganador y otro que acierta la diferencia.
const M1 = {
  id: 1,
  round_number: 1,
  match_date: '2026-03-01T20:00:00.000Z',
  is_finished: true,
  home_score: 2,
  away_score: 1,
  home_team: BOCA,
  away_team: RIVER,
}
const M2 = {
  id: 2,
  round_number: 1,
  match_date: '2026-03-02T20:00:00.000Z',
  is_finished: true,
  home_score: 0,
  away_score: 0,
  home_team: TIGRE,
  away_team: BOCA,
}
const M3 = {
  id: 3,
  round_number: 2,
  match_date: '2026-03-08T20:00:00.000Z',
  is_finished: true,
  home_score: 3,
  away_score: 1,
  home_team: RIVER,
  away_team: TIGRE,
}
const M4 = {
  id: 4,
  round_number: 2,
  match_date: '2026-03-09T20:00:00.000Z',
  is_finished: false,
  home_score: null,
  away_score: null,
  home_team: BOCA,
  away_team: TIGRE,
}

const MATCHES = [M1, M2, M3, M4]

const PREDICTIONS = [
  { match_id: 1, home_prediction: 2, away_prediction: 1, points: 5 }, // pleno
  { match_id: 2, home_prediction: 1, away_prediction: 0, points: 0 }, // error
  { match_id: 3, home_prediction: 2, away_prediction: 0, points: 1 }, // diferencia
  { match_id: 4, home_prediction: 1, away_prediction: 1, points: null }, // sin jugar
]

const ROUND_SCORES = [
  { user_id: 'yo', round_number: 1, total_points: 5 },
  { user_id: 'otro', round_number: 1, total_points: 9 },
  { user_id: 'yo', round_number: 2, total_points: 1 },
  { user_id: 'otro', round_number: 2, total_points: 0 },
]

describe('buildTournamentStats', () => {
  const stats = buildTournamentStats(MATCHES, PREDICTIONS, ROUND_SCORES, 'yo')

  it('arma la forma completa que espera la pantalla', () => {
    expect(Object.keys(stats).sort()).toEqual(Object.keys(emptyStats).sort())
  })

  it('mide el porcentaje de acierto sobre los pronósticos que sumaron', () => {
    // 2 de 3 analizados sumaron: el pleno y el de diferencia acertada.
    expect(stats.metrics.hitPercentage).toBe(66.7)
  })

  it('promedia por fecha con pronósticos, no por fecha del torneo', () => {
    // 6 puntos en 2 fechas. El promedio por partido usa los 3 analizados.
    expect(stats.metrics.totalPoints).toBe(6)
    expect(stats.metrics.avgPerRound).toBe(3)
    expect(stats.additionalStats.avgPointsPerMatch).toBe(2)
  })

  it('separa los pronósticos cargados de los analizables', () => {
    // 4 pronósticos cargados, 3 partidos terminados, 3 analizados.
    expect(stats.additionalStats.totalPredictions).toBe(4)
    expect(stats.additionalStats.finishedMatches).toBe(3)
    expect(stats.accuracyBreakdown.totalAnalyzed).toBe(3)
  })

  it('desglosa los aciertos', () => {
    expect(stats.accuracyBreakdown).toEqual({
      exactScores: 1,
      goalDiffCorrect: 1,
      winnerOnly: 0,
      winnerHits: 1,
      errors: 1,
      bonusGoals: 1,
      totalAnalyzed: 3,
    })
  })

  it('saca la posición de la tabla general del torneo', () => {
    // 6 contra 9: segundo.
    expect(stats.metrics.currentPosition).toBe(2)
    expect(stats.metrics.totalParticipants).toBe(2)
  })

  it('positionByRound lleva la posición en un campo llamado points', () => {
    // Nombre heredado del gráfico, que es el mismo componente para las dos
    // series. Está testeado justamente porque es contraintuitivo.
    expect(stats.positionByRound).toEqual([
      { roundNumber: 1, points: 2 },
      { roundNumber: 2, points: 1 },
    ])
  })

  it('arma la evolución y el palmarés', () => {
    expect(stats.evolutionByRound).toEqual([
      { roundNumber: 1, points: 5 },
      { roundNumber: 2, points: 1 },
    ])
    expect(stats.bestRound).toEqual({ roundNumber: 1, points: 5 })
    expect(stats.worstRound).toEqual({ roundNumber: 2, points: 1 })
    expect(stats.history).toEqual({
      roundsWon: 1,
      podiums: 2,
      bestPosition: 1,
      bestPositionRound: 2,
      roundsImproved: 1,
    })
  })

  it('arma las lecturas por equipo y los récords', () => {
    expect(stats.teamStats).toEqual({
      favoriteTeam: { name: 'Boca', count: 1 },
      bestReadTeam: { name: 'River', percentage: 100, matches: 2 },
      worstReadTeam: { name: 'Boca', percentage: 50, matches: 2 },
    })
    expect(stats.personalRecords.bestMatch).toEqual({
      match: M1,
      prediction: PREDICTIONS[0],
      points: 5,
    })
    expect(stats.personalRecords.mostPreciseRound).toEqual({ roundNumber: 2, percentage: 100 })
  })

  it('arma las rachas', () => {
    expect(stats.streaks).toEqual({
      longestPointStreak: 1,
      longestPlenoStreak: 1,
      longestTop3Streak: 2,
      longestTop10Streak: 2,
    })
  })

  it('sin partidos devuelve la forma completa en cero', () => {
    const vacio = buildTournamentStats([], [], [], 'yo')
    expect(vacio).toEqual(emptyStats)
  })

  it('tolera que las tres entradas sean null', () => {
    expect(() => buildTournamentStats(null, null, null, 'yo')).not.toThrow()
  })
})

describe('normalizeStats', () => {
  it('completa los grupos anidados que falten', () => {
    // La RPC get_personal_stats puede devolver menos campos, y la pantalla lee
    // stats.metrics.totalPoints directo.
    const normalizado = normalizeStats({ metrics: { totalPoints: 9 } })
    expect(normalizado.metrics.totalPoints).toBe(9)
    expect(normalizado.metrics.hitPercentage).toBe(0)
    expect(normalizado.history).toEqual(emptyStats.history)
  })

  it('devuelve la forma vacía completa ante null', () => {
    expect(normalizeStats(null)).toEqual(emptyStats)
  })
})
