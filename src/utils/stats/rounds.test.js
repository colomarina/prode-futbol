import { describe, it, expect } from 'vitest'
import { buildRoundTotals } from './rounds'

/** Un pronóstico errado con `points` puestos a mano, que es lo que se mide acá. */
const entrada = (roundNumber, points) => ({
  match: { round_number: roundNumber, home_score: 1, away_score: 0 },
  prediction: { home_prediction: 0, away_prediction: 1, points },
})

describe('buildRoundTotals', () => {
  it('suma los puntos por fecha y las devuelve ordenadas', () => {
    const { evolutionByRound } = buildRoundTotals([
      entrada(3, 2),
      entrada(1, 5),
      entrada(1, 1),
      entrada(2, 4),
    ])
    expect(evolutionByRound).toEqual([
      { roundNumber: 1, points: 6 },
      { roundNumber: 2, points: 4 },
      { roundNumber: 3, points: 2 },
    ])
  })

  it('elige la mejor y la peor fecha', () => {
    const { bestRound, worstRound } = buildRoundTotals([
      entrada(1, 3),
      entrada(2, 9),
      entrada(3, 1),
    ])
    expect(bestRound).toEqual({ roundNumber: 2, points: 9 })
    expect(worstRound).toEqual({ roundNumber: 3, points: 1 })
  })

  it('ante empate de puntos gana la fecha más temprana', () => {
    const { bestRound, worstRound } = buildRoundTotals([entrada(5, 4), entrada(2, 4)])
    expect(bestRound.roundNumber).toBe(2)
    expect(worstRound.roundNumber).toBe(2)
  })

  it('sin datos devuelve la fecha vacía en vez de null', () => {
    // La pantalla lee `bestRound.points`: un null ahí es un crash.
    const { evolutionByRound, bestRound, worstRound, mostPreciseRound } = buildRoundTotals([])
    expect(evolutionByRound).toEqual([])
    expect(bestRound).toEqual({ roundNumber: null, points: 0 })
    expect(worstRound).toEqual({ roundNumber: null, points: 0 })
    expect(mostPreciseRound).toBeNull()
  })

  it('la fecha más precisa mide proporción, no total de puntos', () => {
    // La fecha 1 hace más puntos (5 contra 3) pero acierta 1 de 3; la fecha 2
    // acierta 1 de 1. Gana la 2.
    const { evolutionByRound, mostPreciseRound } = buildRoundTotals([
      entrada(1, 5),
      entrada(1, 0),
      entrada(1, 0),
      entrada(2, 3),
    ])
    expect(evolutionByRound).toEqual([
      { roundNumber: 1, points: 5 },
      { roundNumber: 2, points: 3 },
    ])
    expect(mostPreciseRound).toEqual({ roundNumber: 2, percentage: 100 })
  })

  it('redondea el porcentaje a un decimal', () => {
    // 1 de 3 son 33.333…
    const { mostPreciseRound } = buildRoundTotals([entrada(1, 2), entrada(1, 0), entrada(1, 0)])
    expect(mostPreciseRound).toEqual({ roundNumber: 1, percentage: 33.3 })
  })

  it('ante empate de porcentaje gana la fecha más temprana', () => {
    const { mostPreciseRound } = buildRoundTotals([entrada(7, 1), entrada(3, 1)])
    expect(mostPreciseRound.roundNumber).toBe(3)
  })
})
