import { describe, it, expect } from 'vitest'
import { getLongestConsecutive, buildStreaks } from './streaks'

describe('getLongestConsecutive', () => {
  it('devuelve la tira más larga, no la última', () => {
    expect(getLongestConsecutive([1, 1, 1, 0, 1, 1], n => n === 1)).toBe(3)
  })

  it('cuenta una racha que llega hasta el final', () => {
    expect(getLongestConsecutive([0, 1, 1, 1], n => n === 1)).toBe(3)
  })

  it('es cero cuando nada cumple, y con la lista vacía', () => {
    expect(getLongestConsecutive([0, 0], n => n === 1)).toBe(0)
    expect(getLongestConsecutive([], () => true)).toBe(0)
  })
})

/** Partido 1-0 con el pronóstico y los puntos que se le pasen. */
const entrada = (pred, points) => ({
  match: { home_score: 1, away_score: 0 },
  prediction: { home_prediction: pred[0], away_prediction: pred[1], points },
})

describe('buildStreaks', () => {
  it('la racha de puntos y la de pleno se cuentan sobre secuencias distintas', () => {
    // Cuatro pronósticos seguidos con puntos, de los cuales dos son plenos.
    const analizados = [
      entrada([1, 0], 5), // pleno
      entrada([1, 0], 5), // pleno
      entrada([2, 0], 1), // suma, pero no es pleno
      entrada([3, 0], 1), // suma, pero no es pleno
      entrada([0, 1], 0), // corta las dos
    ]
    const { longestPointStreak, longestPlenoStreak } = buildStreaks(analizados, [])
    expect(longestPointStreak).toBe(4)
    expect(longestPlenoStreak).toBe(2)
  })

  it('un pronóstico que suma sin acertar el ganador sostiene la racha de puntos', () => {
    // El bonus de goles da puntos con el ganador errado: para el usuario eso es
    // seguir sumando, así que la racha no se corta.
    const { longestPointStreak, longestPlenoStreak } = buildStreaks(
      [entrada([1, 0], 3), entrada([0, 1], 1), entrada([1, 0], 3)],
      []
    )
    expect(longestPointStreak).toBe(3)
    expect(longestPlenoStreak).toBe(1)
  })

  it('las rachas de top se cuentan sobre el historial de posiciones', () => {
    const historial = [
      { position: 1 },
      { position: 3 },
      { position: 7 },
      { position: 2 },
      { position: 15 },
    ]
    const { longestTop3Streak, longestTop10Streak } = buildStreaks([], historial)
    expect(longestTop3Streak).toBe(2)
    expect(longestTop10Streak).toBe(4)
  })

  it('sin datos las cuatro rachas son cero', () => {
    expect(buildStreaks([], [])).toEqual({
      longestPointStreak: 0,
      longestPlenoStreak: 0,
      longestTop3Streak: 0,
      longestTop10Streak: 0,
    })
  })
})
