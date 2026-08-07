import { describe, it, expect } from 'vitest'
import { compareByPoints, assignPositions } from './ranking'

const byTotal = compareByPoints(
  entry => entry.points,
  entry => entry.id
)

describe('compareByPoints', () => {
  it('ordena de mas a menos puntos', () => {
    const sorted = [
      { id: 'a', points: 3 },
      { id: 'b', points: 10 },
      { id: 'c', points: 7 },
    ]
      .sort(byTotal)
      .map(e => e.id)

    expect(sorted).toEqual(['b', 'c', 'a'])
  })

  it('desempata por id para que el orden sea determinista', () => {
    const sorted = [
      { id: 'zoe', points: 5 },
      { id: 'ana', points: 5 },
      { id: 'nico', points: 5 },
    ]
      .sort(byTotal)
      .map(e => e.id)

    expect(sorted).toEqual(['ana', 'nico', 'zoe'])
  })

  it('da el mismo resultado sin importar el orden de entrada', () => {
    // Este es el punto: la DB puede devolver los empatados en cualquier orden.
    const entrada = [
      { id: 'b', points: 5 },
      { id: 'a', points: 5 },
      { id: 'c', points: 9 },
    ]
    const alReves = [...entrada].reverse()

    expect([...entrada].sort(byTotal)).toEqual([...alReves].sort(byTotal))
  })

  it('trata null y undefined como cero puntos', () => {
    const sorted = [
      { id: 'a', points: null },
      { id: 'b', points: 2 },
      { id: 'c', points: undefined },
    ]
      .sort(byTotal)
      .map(e => e.id)

    expect(sorted).toEqual(['b', 'a', 'c'])
  })

  it('compara puntos numericos aunque lleguen como string', () => {
    const sorted = [
      { id: 'a', points: '9' },
      { id: 'b', points: '10' },
    ]
      .sort(byTotal)
      .map(e => e.id)

    // Como string, '10' < '9'. Tienen que compararse como numeros.
    expect(sorted).toEqual(['b', 'a'])
  })

  it('compara ids numericos sin romperse', () => {
    const sorted = [
      { id: 2, points: 5 },
      { id: 1, points: 5 },
    ]
      .sort(byTotal)
      .map(e => e.id)

    expect(sorted).toEqual([1, 2])
  })
})

describe('assignPositions', () => {
  it('numera desde 1 respetando el orden recibido', () => {
    expect(assignPositions([{ id: 'a' }, { id: 'b' }])).toEqual([
      { id: 'a', position: 1 },
      { id: 'b', position: 2 },
    ])
  })

  it('da posiciones consecutivas a los empatados', () => {
    const ranked = assignPositions([
      { id: 'a', points: 5 },
      { id: 'b', points: 5 },
    ])

    expect(ranked.map(e => e.position)).toEqual([1, 2])
  })

  it('tolera entradas vacias', () => {
    expect(assignPositions([])).toEqual([])
    expect(assignPositions(null)).toEqual([])
    expect(assignPositions(undefined)).toEqual([])
  })

  it('no muta el array original', () => {
    const original = [{ id: 'a' }]
    assignPositions(original)
    expect(original[0]).not.toHaveProperty('position')
  })
})
