import { describe, it, expect } from 'vitest'
import { collectAnalyzedPredictions } from './analyzed'

const partido = (id, extra = {}) => ({
  id,
  round_number: 1,
  match_date: '2026-03-10T20:00:00.000Z',
  is_finished: true,
  ...extra,
})

describe('collectAnalyzedPredictions', () => {
  it('deja afuera los partidos que no terminaron', () => {
    const { analyzedPredictions } = collectAnalyzedPredictions(
      [partido(1), partido(2, { is_finished: false })],
      [{ match_id: 1 }, { match_id: 2 }]
    )
    expect(analyzedPredictions.map(e => e.match.id)).toEqual([1])
  })

  it('deja afuera los partidos que el usuario no pronosticó', () => {
    // No pronosticar no es errar: no entra en ninguna cuenta.
    const { analyzedPredictions } = collectAnalyzedPredictions(
      [partido(1), partido(2)],
      [{ match_id: 2 }]
    )
    expect(analyzedPredictions.map(e => e.match.id)).toEqual([2])
  })

  it('ordena por fecha de partido y no por número de fecha', () => {
    // El caso real: la fecha 2 se adelantó y se jugó antes que la 1. Las rachas
    // recorren este array en orden, así que ordenar por round_number las
    // calcularía mal.
    const matches = [
      partido(1, { round_number: 1, match_date: '2026-03-20T20:00:00.000Z' }),
      partido(2, { round_number: 2, match_date: '2026-03-10T20:00:00.000Z' }),
      partido(3, { round_number: 3, match_date: '2026-03-15T20:00:00.000Z' }),
    ]
    const { analyzedPredictions } = collectAnalyzedPredictions(
      matches,
      matches.map(m => ({ match_id: m.id }))
    )
    expect(analyzedPredictions.map(e => e.match.round_number)).toEqual([2, 3, 1])
  })

  it('cuenta los partidos terminados aunque no estén pronosticados', () => {
    // `finishedMatches` alimenta additionalStats.finishedMatches, que es del
    // torneo y no del usuario.
    const { finishedMatches, analyzedPredictions } = collectAnalyzedPredictions(
      [partido(1), partido(2), partido(3, { is_finished: false })],
      [{ match_id: 1 }]
    )
    expect(finishedMatches).toHaveLength(2)
    expect(analyzedPredictions).toHaveLength(1)
  })

  it('no muta el array de partidos que recibe', () => {
    // El sort es sobre una copia: `matches` viene del cache de React Query y
    // ordenarlo in place se lo ordenaría a todos los demás consumidores.
    const matches = [
      partido(1, { match_date: '2026-03-20T20:00:00.000Z' }),
      partido(2, { match_date: '2026-03-10T20:00:00.000Z' }),
    ]
    collectAnalyzedPredictions(matches, [{ match_id: 1 }, { match_id: 2 }])
    expect(matches.map(m => m.id)).toEqual([1, 2])
  })

  it('tolera nulos en las dos entradas', () => {
    expect(collectAnalyzedPredictions(null, null)).toEqual({
      analyzedPredictions: [],
      finishedMatches: [],
    })
  })
})
