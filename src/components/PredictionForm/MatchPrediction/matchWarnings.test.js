import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getMatchWarning, getMatchStatus } from './matchWarnings'
import { PREDICTION_CUTOFF_MINUTES, RESULT_LOAD_DELAY_HOURS } from '../../../utils/matchTiming'

const AHORA = new Date('2026-08-13T20:00:00.000Z')
const MINUTO = 60 * 1000
const HORA = 60 * MINUTO

/** Un horario de partido relativo a "ahora". */
const enMinutos = minutos => new Date(AHORA.getTime() + minutos * MINUTO).toISOString()
const enHoras = horas => new Date(AHORA.getTime() + horas * HORA).toISOString()

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(AHORA)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('getMatchWarning', () => {
  it('no avisa nada de un partido que todavía no empezó', () => {
    expect(
      getMatchWarning({ matchDate: enHoras(3), isFinished: false, hasPrediction: false })
    ).toBeNull()
  })

  it('no avisa nada si el partido ya tiene pronóstico', () => {
    expect(
      getMatchWarning({ matchDate: enHoras(-5), isFinished: false, hasPrediction: true })
    ).toBeNull()
  })

  it('no avisa nada de un partido finalizado: ahí se muestra el resultado', () => {
    expect(
      getMatchWarning({ matchDate: enHoras(-5), isFinished: true, hasPrediction: false })
    ).toBeNull()
  })

  it('un partido en curso sin pronóstico avisa que ya cerró', () => {
    // Arrancó hace media hora, o sea antes de que se pueda cargar el resultado.
    expect(RESULT_LOAD_DELAY_HOURS).toBe(2)
    expect(
      getMatchWarning({ matchDate: enMinutos(-30), isFinished: false, hasPrediction: false })
    ).toBe('locked')
  })

  it('un partido viejo sin pronóstico avisa que se perdió', () => {
    // Pasada la ventana de carga del resultado, el partido ya se jugó entero.
    expect(
      getMatchWarning({
        matchDate: enHoras(-(RESULT_LOAD_DELAY_HOURS + 1)),
        isFinished: false,
        hasPrediction: false,
      })
    ).toBe('missed')
  })

  it('el corte entre los dos avisos es el delay de carga del resultado', () => {
    const justoAntes = enHoras(-RESULT_LOAD_DELAY_HOURS + 0.01)
    const justoDespues = enHoras(-RESULT_LOAD_DELAY_HOURS - 0.01)

    expect(
      getMatchWarning({ matchDate: justoAntes, isFinished: false, hasPrediction: false })
    ).toBe('locked')
    expect(
      getMatchWarning({ matchDate: justoDespues, isFinished: false, hasPrediction: false })
    ).toBe('missed')
  })
})

describe('getMatchStatus', () => {
  it('un partido finalizado siempre dice finalizado', () => {
    // Incluso con la fecha en el futuro, que es un dato inconsistente pero
    // posible si el admin reprogramó después de cargar el resultado.
    expect(getMatchStatus({ matchDate: enHoras(3), isFinished: true })).toBe('finished')
    expect(getMatchStatus({ matchDate: enHoras(-3), isFinished: true })).toBe('finished')
  })

  it('un partido en curso dice en juego', () => {
    expect(getMatchStatus({ matchDate: enMinutos(-30), isFinished: false })).toBe('playing')
  })

  it('un partido que falta no muestra estado', () => {
    expect(getMatchStatus({ matchDate: enHoras(3), isFinished: false })).toBeNull()
  })

  it('en la ventana de cierre, antes del horario, todavía no está en juego', () => {
    // Cerrado para pronosticar pero sin arrancar: no es "en juego".
    expect(PREDICTION_CUTOFF_MINUTES).toBe(10)
    expect(getMatchStatus({ matchDate: enMinutos(5), isFinished: false })).toBeNull()
  })

  it('en modo consulta un partido futuro tampoco está en juego', () => {
    // isReadOnly bloquea el pronóstico, pero el partido no arrancó: sin el guard
    // de `hasMatchStarted` todos los partidos de un torneo cerrado saldrían "en
    // juego".
    expect(
      getMatchStatus({ matchDate: enHoras(3), isFinished: false, isReadOnly: true })
    ).toBeNull()
  })
})
