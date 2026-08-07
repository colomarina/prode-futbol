import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  PREDICTION_CUTOFF_MINUTES,
  RESULT_LOAD_DELAY_HOURS,
  canPredictMatch,
  hasMatchStarted,
  canLoadResult,
  secondsUntilCutoff,
  getNextActiveRoundNumber,
} from './matchTiming'

// Fuente unica de verdad de los tiempos del prode. Si estos tests fallan,
// se rompio el cierre de pronosticos o la habilitacion de carga de resultados.

const NOW = new Date('2026-08-07T20:00:00.000Z')
const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE

/** Fecha de partido desplazada respecto de NOW. */
const matchAt = offsetMs => new Date(NOW.getTime() + offsetMs).toISOString()

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('constantes', () => {
  it('mantiene los valores que asume el resto de la app', () => {
    expect(PREDICTION_CUTOFF_MINUTES).toBe(10)
    expect(RESULT_LOAD_DELAY_HOURS).toBe(2)
  })
})

describe('canPredictMatch', () => {
  it('permite pronosticar bien antes del partido', () => {
    expect(canPredictMatch(matchAt(2 * HOUR))).toBe(true)
  })

  it('permite pronosticar justo antes del cierre', () => {
    expect(canPredictMatch(matchAt(11 * MINUTE))).toBe(true)
  })

  it('cierra exactamente en el minuto de cutoff', () => {
    expect(canPredictMatch(matchAt(PREDICTION_CUTOFF_MINUTES * MINUTE))).toBe(false)
  })

  it('no permite pronosticar dentro de la ventana de cierre', () => {
    expect(canPredictMatch(matchAt(5 * MINUTE))).toBe(false)
  })

  it('no permite pronosticar un partido ya empezado', () => {
    expect(canPredictMatch(matchAt(-MINUTE))).toBe(false)
  })
})

describe('hasMatchStarted', () => {
  it('es falso antes del horario del partido', () => {
    expect(hasMatchStarted(matchAt(MINUTE))).toBe(false)
  })

  it('es verdadero exactamente al horario del partido', () => {
    expect(hasMatchStarted(matchAt(0))).toBe(true)
  })

  it('es verdadero despues del horario del partido', () => {
    expect(hasMatchStarted(matchAt(-HOUR))).toBe(true)
  })
})

describe('canLoadResult', () => {
  it('no habilita la carga apenas termina el horario de inicio', () => {
    expect(canLoadResult(matchAt(0))).toBe(false)
  })

  it('no habilita la carga antes del delay', () => {
    expect(canLoadResult(matchAt(-HOUR))).toBe(false)
  })

  it('habilita la carga exactamente al cumplirse el delay', () => {
    expect(canLoadResult(matchAt(-RESULT_LOAD_DELAY_HOURS * HOUR))).toBe(true)
  })

  it('habilita la carga pasado el delay', () => {
    expect(canLoadResult(matchAt(-5 * HOUR))).toBe(true)
  })
})

describe('secondsUntilCutoff', () => {
  it('descuenta el cutoff del tiempo restante', () => {
    // El partido es en 30 min y el cierre es 10 min antes => quedan 20 min.
    expect(secondsUntilCutoff(matchAt(30 * MINUTE))).toBe(20 * 60)
  })

  it('es cero justo en el cutoff', () => {
    expect(secondsUntilCutoff(matchAt(PREDICTION_CUTOFF_MINUTES * MINUTE))).toBe(0)
  })

  it('es negativo una vez pasado el cierre', () => {
    expect(secondsUntilCutoff(matchAt(0))).toBe(-PREDICTION_CUTOFF_MINUTES * 60)
  })
})

describe('getNextActiveRoundNumber', () => {
  const rounds = [{ round_number: 1 }, { round_number: 2 }, { round_number: 3 }]

  it('devuelve la ronda mas baja con partidos todavia pronosticables', () => {
    const matches = [
      { round_number: 3, match_date: matchAt(3 * HOUR) },
      { round_number: 2, match_date: matchAt(HOUR) },
      { round_number: 1, match_date: matchAt(-HOUR) },
    ]

    expect(getNextActiveRoundNumber(rounds, matches)).toBe(2)
  })

  it('ignora los partidos dentro de la ventana de cierre', () => {
    const matches = [
      { round_number: 1, match_date: matchAt(5 * MINUTE) },
      { round_number: 2, match_date: matchAt(HOUR) },
    ]

    expect(getNextActiveRoundNumber(rounds, matches)).toBe(2)
  })

  it('cae a la ronda mas baja con partidos futuros si no hay pronosticables', () => {
    // Ambos ya pasaron el cutoff pero todavia no empezaron.
    const matches = [
      { round_number: 2, match_date: matchAt(2 * MINUTE) },
      { round_number: 1, match_date: matchAt(5 * MINUTE) },
    ]

    expect(getNextActiveRoundNumber(rounds, matches)).toBe(1)
  })

  it('cae a la ronda mas alta del torneo si ya se jugo todo', () => {
    const matches = [
      { round_number: 1, match_date: matchAt(-3 * HOUR) },
      { round_number: 2, match_date: matchAt(-2 * HOUR) },
    ]

    expect(getNextActiveRoundNumber(rounds, matches)).toBe(3)
  })

  it('descarta round_number no numericos', () => {
    const matches = [
      { round_number: null, match_date: matchAt(HOUR) },
      { round_number: 'x', match_date: matchAt(HOUR) },
      { round_number: 4, match_date: matchAt(HOUR) },
    ]

    expect(getNextActiveRoundNumber(rounds, matches)).toBe(4)
  })

  it('devuelve null sin rondas ni partidos', () => {
    expect(getNextActiveRoundNumber([], [])).toBeNull()
  })

  it('tolera argumentos nulos', () => {
    expect(getNextActiveRoundNumber(null, null)).toBeNull()
    expect(getNextActiveRoundNumber(undefined, undefined)).toBeNull()
  })
})
