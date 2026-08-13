import { describe, it, expect } from 'vitest'
import { findBestMatch } from './records'

const entrada = (id, points) => ({
  match: { id, home_score: 1, away_score: 0 },
  prediction: { home_prediction: 1, away_prediction: 0, points },
})

describe('findBestMatch', () => {
  it('devuelve el pronóstico que más puntos dio', () => {
    const mejor = findBestMatch([entrada(1, 2), entrada(2, 7), entrada(3, 5)])
    expect(mejor.match.id).toBe(2)
    expect(mejor.points).toBe(7)
  })

  it('ante empate gana el más antiguo', () => {
    // `analyzedPredictions` viene ordenado por fecha de juego, así que el primero
    // del array es la primera vez que logró ese récord.
    expect(findBestMatch([entrada(1, 5), entrada(2, 5)]).match.id).toBe(1)
  })

  it('devuelve null sin pronósticos', () => {
    expect(findBestMatch([])).toBeNull()
  })

  it('devuelve el partido incluso cuando el mejor sumó cero', () => {
    // La pantalla muestra "tu mejor partido" y prefiere mostrar el menos malo a
    // no mostrar nada.
    const mejor = findBestMatch([entrada(1, 0), entrada(2, 0)])
    expect(mejor).not.toBeNull()
    expect(mejor.points).toBe(0)
  })
})
