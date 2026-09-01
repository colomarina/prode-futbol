import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { collectPredictionsToSave, findExpiredPredictions, getSaveToast } from './savePredictions'
import { PREDICTION_CUTOFF_MINUTES } from '../../utils/matchTiming'

const AHORA = new Date('2026-08-13T20:00:00.000Z')
const MINUTO = 60 * 1000

/** Un horario de partido relativo a "ahora". */
const enMinutos = minutos => new Date(AHORA.getTime() + minutos * MINUTO).toISOString()

/** Abierto para pronosticar: falta más que la ventana de cierre. */
const abierto = (id, extra = {}) => ({ id, match_date: enMinutos(120), ...extra })

/** Cerrado: ya pasó el corte. */
const cerrado = (id, extra = {}) => ({ id, match_date: enMinutos(-30), ...extra })

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(AHORA)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('collectPredictionsToSave', () => {
  it('manda los pronósticos completos de los partidos abiertos', () => {
    const matches = [abierto('a'), abierto('b')]
    const predictionValues = {
      a: { home: '2', away: '1' },
      b: { home: '0', away: '0' },
    }

    expect(collectPredictionsToSave({ matches, predictionValues })).toEqual([
      { matchId: 'a', homePrediction: 2, awayPrediction: 1, qualifierPredictionId: null },
      { matchId: 'b', homePrediction: 0, awayPrediction: 0, qualifierPredictionId: null },
    ])
  })

  it('un 0-0 se guarda: el cero es un valor, no un campo vacío', () => {
    const resultado = collectPredictionsToSave({
      matches: [abierto('a')],
      predictionValues: { a: { home: '0', away: '0' } },
    })

    expect(resultado).toHaveLength(1)
    expect(resultado[0].homePrediction).toBe(0)
  })

  it('descarta los que tienen un solo gol cargado', () => {
    expect(
      collectPredictionsToSave({
        matches: [abierto('a'), abierto('b')],
        predictionValues: { a: { home: '2' }, b: { away: '1' } },
      })
    ).toEqual([])
  })

  it('descarta los partidos que ya pasaron el cierre, aunque estén completos', () => {
    // El plazo puede vencer entre que se pintó la tarjeta y el click en Guardar:
    // no hay contador en vivo que deshabilite el input.
    expect(PREDICTION_CUTOFF_MINUTES).toBe(10)

    expect(
      collectPredictionsToSave({
        matches: [cerrado('a')],
        predictionValues: { a: { home: '2', away: '1' } },
      })
    ).toEqual([])
  })

  it('lleva el clasificado de un playoff cuando está elegido', () => {
    const resultado = collectPredictionsToSave({
      matches: [abierto('a', { is_playoff: true })],
      predictionValues: { a: { home: '1', away: '1', qualifier: 'equipo-7' } },
    })

    expect(resultado[0].qualifierPredictionId).toBe('equipo-7')
  })
})

describe('findExpiredPredictions', () => {
  const sinGuardados = new Map()

  it('cuenta el pronóstico nuevo de un partido que se cerró mientras cargaba', () => {
    const vencidos = findExpiredPredictions({
      matches: [cerrado('a')],
      predictionValues: { a: { home: '2', away: '1' } },
      predictionsByMatchId: sinGuardados,
    })

    expect(vencidos.map(m => m.id)).toEqual(['a'])
  })

  it('no cuenta los partidos abiertos: esos se guardan', () => {
    expect(
      findExpiredPredictions({
        matches: [abierto('a')],
        predictionValues: { a: { home: '2', away: '1' } },
        predictionsByMatchId: sinGuardados,
      })
    ).toEqual([])
  })

  it('no cuenta un partido cerrado cuyos valores son los ya guardados', () => {
    // Es el caso que hacía inflar el contador: `MatchPrediction` siembra
    // `predictionValues` con lo guardado, así que un partido viejo que el usuario
    // nunca tocó igual tiene valores.
    expect(
      findExpiredPredictions({
        matches: [cerrado('a')],
        predictionValues: { a: { home: '2', away: '1' } },
        predictionsByMatchId: new Map([['a', { home_prediction: 2, away_prediction: 1 }]]),
      })
    ).toEqual([])
  })

  it('sí cuenta un partido cerrado donde el usuario cambió lo que ya estaba guardado', () => {
    const vencidos = findExpiredPredictions({
      matches: [cerrado('a')],
      predictionValues: { a: { home: '3', away: '1' } },
      predictionsByMatchId: new Map([['a', { home_prediction: 2, away_prediction: 1 }]]),
    })

    expect(vencidos.map(m => m.id)).toEqual(['a'])
  })

  it('no cuenta un partido cerrado sin valores cargados', () => {
    expect(
      findExpiredPredictions({
        matches: [cerrado('a')],
        predictionValues: {},
        predictionsByMatchId: sinGuardados,
      })
    ).toEqual([])
  })
})

describe('getSaveToast', () => {
  it('el error gana sobre cualquier otro mensaje', () => {
    expect(getSaveToast({ savedCount: 3, expiredCount: 2, error: new Error('boom') })).toEqual({
      message: 'Error al guardar pronósticos. Intentá de nuevo.',
      type: 'error',
    })
  })

  it('sin nada que guardar y sin vencidos avisa que no hay pronósticos', () => {
    expect(getSaveToast({ savedCount: 0, expiredCount: 0 })).toEqual({
      message: 'No hay pronósticos para guardar',
      type: 'warning',
    })
  })

  it('sin nada que guardar y con un vencido explica que venció el plazo', () => {
    // Este era el silencio: el único pronóstico cargado se venció y Guardar no
    // mostraba nada.
    expect(getSaveToast({ savedCount: 0, expiredCount: 1 })).toEqual({
      message: 'El plazo venció mientras cargabas: ese pronóstico no se guardó.',
      type: 'warning',
    })
  })

  it('sin nada que guardar y con varios vencidos los cuenta', () => {
    expect(getSaveToast({ savedCount: 0, expiredCount: 3 }).message).toBe(
      'El plazo venció mientras cargabas: esos 3 pronósticos no se guardaron.'
    )
  })

  it('un guardado sin vencidos es un éxito en singular', () => {
    expect(getSaveToast({ savedCount: 1, expiredCount: 0 })).toEqual({
      message: '1 pronóstico guardado correctamente',
      type: 'success',
    })
  })

  it('varios guardados sin vencidos van en plural', () => {
    expect(getSaveToast({ savedCount: 4, expiredCount: 0 })).toEqual({
      message: '4 pronósticos guardados correctamente',
      type: 'success',
    })
  })

  it('un guardado con vencidos baja el tono a warning', () => {
    expect(getSaveToast({ savedCount: 2, expiredCount: 1 })).toEqual({
      message: '2 pronósticos guardados correctamente. Otro quedó afuera porque venció el plazo.',
      type: 'warning',
    })
  })

  it('con varios vencidos el mensaje los cuenta', () => {
    expect(getSaveToast({ savedCount: 2, expiredCount: 3 }).message).toBe(
      '2 pronósticos guardados correctamente. Otros 3 quedaron afuera porque venció el plazo.'
    )
  })
})
