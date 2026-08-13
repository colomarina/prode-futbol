import { describe, it, expect } from 'vitest'
import { buildPositionHistory, buildOverallRanking, buildHistory } from './positions'

const score = (userId, roundNumber, totalPoints) => ({
  user_id: userId,
  round_number: roundNumber,
  total_points: totalPoints,
})

describe('buildPositionHistory', () => {
  it('devuelve el puesto del usuario en cada fecha, ordenado por fecha', () => {
    const historial = buildPositionHistory(
      [score('yo', 2, 5), score('otro', 2, 9), score('yo', 1, 8), score('otro', 1, 3)],
      'yo'
    )
    expect(historial).toEqual([
      { roundNumber: 1, position: 1, totalPoints: 8 },
      { roundNumber: 2, position: 2, totalPoints: 5 },
    ])
  })

  it('omite las fechas en las que el usuario no tiene fila', () => {
    // No jugar no es salir último: la fecha no entra, y por lo tanto tampoco
    // corta las rachas de top 3 / top 10.
    const historial = buildPositionHistory([score('otro', 1, 5), score('yo', 2, 5)], 'yo')
    expect(historial.map(e => e.roundNumber)).toEqual([2])
  })

  it('compara el id como texto', () => {
    // `round_scores.user_id` es un uuid, pero los tests y algunas respuestas lo
    // traen como número. Sin el String() el usuario no se encuentra a sí mismo.
    expect(buildPositionHistory([score(42, 1, 5)], 42)).toHaveLength(1)
    expect(buildPositionHistory([score(42, 1, 5)], '42')).toHaveLength(1)
  })

  it('ordena las fechas numéricamente y no como texto', () => {
    const historial = buildPositionHistory(
      [score('yo', 10, 1), score('yo', 2, 1), score('yo', 1, 1)],
      'yo'
    )
    expect(historial.map(e => e.roundNumber)).toEqual([1, 2, 10])
  })

  it('tolera nulos', () => {
    expect(buildPositionHistory(null, 'yo')).toEqual([])
  })
})

describe('buildOverallRanking', () => {
  it('suma todas las fechas por usuario y asigna puestos', () => {
    const ranking = buildOverallRanking([score('yo', 1, 5), score('yo', 2, 5), score('otro', 1, 9)])
    expect(ranking).toEqual([
      { userId: 'yo', totalPoints: 10, position: 1 },
      { userId: 'otro', totalPoints: 9, position: 2 },
    ])
  })

  it('desempata de forma determinista', () => {
    // Sin desempate, el orden depende de cómo devolvió las filas Postgres. El
    // criterio vive en utils/ranking.js y lo comparte con la tabla de posiciones.
    const a = buildOverallRanking([score('zeta', 1, 5), score('alfa', 1, 5)])
    const b = buildOverallRanking([score('alfa', 1, 5), score('zeta', 1, 5)])
    expect(a).toEqual(b)
    expect(a[0].userId).toBe('alfa')
  })

  it('trata los puntos nulos como cero', () => {
    expect(buildOverallRanking([score('yo', 1, null)])[0].totalPoints).toBe(0)
  })
})

describe('buildHistory', () => {
  const historial = [
    { roundNumber: 1, position: 5 },
    { roundNumber: 2, position: 1 },
    { roundNumber: 3, position: 3 },
    { roundNumber: 4, position: 1 },
  ]

  it('cuenta fechas ganadas, podios y mejoras', () => {
    expect(buildHistory(historial)).toEqual({
      roundsWon: 2,
      podiums: 3,
      bestPosition: 1,
      bestPositionRound: 2,
      roundsImproved: 2,
    })
  })

  it('la mejor posición se queda con la primera vez que la logró', () => {
    // Es un récord personal: gana la fecha 2, no la 4.
    expect(buildHistory(historial).bestPositionRound).toBe(2)
  })

  it('las mejoras se comparan contra la fecha anterior del historial, no la del torneo', () => {
    // Si no jugó la fecha 3, la 4 se compara contra la 2.
    const conHueco = [
      { roundNumber: 2, position: 8 },
      { roundNumber: 4, position: 4 },
    ]
    expect(buildHistory(conHueco).roundsImproved).toBe(1)
  })

  it('sin historial devuelve todo en cero y las posiciones en null', () => {
    expect(buildHistory([])).toEqual({
      roundsWon: 0,
      podiums: 0,
      bestPosition: null,
      bestPositionRound: null,
      roundsImproved: 0,
    })
  })
})
