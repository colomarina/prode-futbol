import { describe, it, expect } from 'vitest'
import {
  getOutcome,
  classifyPrediction,
  buildAccuracyBreakdown,
  countScoringPredictions,
  sumPoints,
  PREDICTION_KIND,
  GOALS_BONUS_MIN_TOTAL,
} from './accuracy'

const partido = (home, away) => ({ home_score: home, away_score: away })
const pronostico = (home, away, points = 0) => ({
  home_prediction: home,
  away_prediction: away,
  points,
})

describe('getOutcome', () => {
  it('distingue local, visitante y empate', () => {
    expect(getOutcome(2, 1)).toBe(1)
    expect(getOutcome(1, 2)).toBe(-1)
    expect(getOutcome(1, 1)).toBe(0)
  })

  it('trata los indefinidos como empate en vez de tirar', () => {
    // Un partido marcado como terminado pero sin marcador cargado. No es una
    // situación teórica: el admin puede finalizar la fecha antes de cargar todo.
    expect(getOutcome(NaN, NaN)).toBe(0)
  })
})

describe('classifyPrediction', () => {
  it('marca el pleno cuando coinciden los dos marcadores', () => {
    const { kind } = classifyPrediction(partido(2, 1), pronostico(2, 1))
    expect(kind).toBe(PREDICTION_KIND.EXACT)
  })

  it('separa acertar la diferencia de acertar solo el ganador', () => {
    // 3-2 contra un real 2-1: mismo ganador y misma diferencia.
    expect(classifyPrediction(partido(2, 1), pronostico(3, 2)).kind).toBe(PREDICTION_KIND.GOAL_DIFF)
    // 3-0 contra un real 2-1: mismo ganador, otra diferencia.
    expect(classifyPrediction(partido(2, 1), pronostico(3, 0)).kind).toBe(
      PREDICTION_KIND.WINNER_ONLY
    )
  })

  it('un empate con el marcador equivocado acierta la diferencia, no el pleno', () => {
    // Los dos son diferencia 0, así que nunca cae en winnerOnly.
    expect(classifyPrediction(partido(1, 1), pronostico(2, 2)).kind).toBe(PREDICTION_KIND.GOAL_DIFF)
  })

  it('marca error cuando cambia el ganador', () => {
    expect(classifyPrediction(partido(2, 1), pronostico(0, 1)).kind).toBe(PREDICTION_KIND.ERROR)
  })

  it('el bonus de goles pide el total exacto y un mínimo de goles', () => {
    // 2-1: total 3, llega al mínimo. Un 3-0 predicho también suma 3.
    expect(classifyPrediction(partido(2, 1), pronostico(3, 0)).hitsGoalsBonus).toBe(true)
    // 1-1: total 2, no llega al mínimo aunque el pronóstico sume igual.
    expect(GOALS_BONUS_MIN_TOTAL).toBe(3)
    expect(classifyPrediction(partido(1, 1), pronostico(2, 0)).hitsGoalsBonus).toBe(false)
    // Total distinto: no hay bonus.
    expect(classifyPrediction(partido(2, 1), pronostico(2, 2)).hitsGoalsBonus).toBe(false)
  })

  it('el bonus de goles puede darse en un partido mal leído', () => {
    // Es el motivo de que `scored` exista aparte de `kind`: el usuario sumó
    // puntos con un pronóstico que erró el ganador.
    const resultado = classifyPrediction(partido(3, 0), pronostico(0, 3, 1))
    expect(resultado.kind).toBe(PREDICTION_KIND.ERROR)
    expect(resultado.hitsGoalsBonus).toBe(true)
    expect(resultado.scored).toBe(true)
  })

  it('lee los puntos de la fila y trata el null como cero', () => {
    // Los puntos no se calculan acá: los escribe Supabase.
    expect(classifyPrediction(partido(1, 0), pronostico(1, 0, 5)).points).toBe(5)
    expect(classifyPrediction(partido(1, 0), pronostico(1, 0, null)).points).toBe(0)
    expect(classifyPrediction(partido(1, 0), pronostico(1, 0, null)).scored).toBe(false)
  })

  it('con marcadores nulos el partido cuenta como 0-0', () => {
    const resultado = classifyPrediction(partido(null, null), pronostico(0, 0))
    expect(resultado.kind).toBe(PREDICTION_KIND.EXACT)
  })
})

describe('buildAccuracyBreakdown', () => {
  // Todos contra un real 2-1, o sea 3 goles totales.
  const analizados = [
    { match: partido(2, 1), prediction: pronostico(2, 1, 5) }, // pleno,         3 goles → bonus
    { match: partido(2, 1), prediction: pronostico(3, 2, 3) }, // diferencia,    5 goles
    { match: partido(2, 1), prediction: pronostico(3, 0, 1) }, // solo ganador,  3 goles → bonus
    { match: partido(2, 1), prediction: pronostico(0, 2, 0) }, // error,         2 goles
  ]

  it('cuenta cada categoría y suma las dos intermedias en winnerHits', () => {
    expect(buildAccuracyBreakdown(analizados)).toEqual({
      exactScores: 1,
      goalDiffCorrect: 1,
      winnerOnly: 1,
      winnerHits: 2,
      errors: 1,
      bonusGoals: 2,
      totalAnalyzed: 4,
    })
  })

  it('no expone matchesWithPoints: eso lo cuenta countScoringPredictions', () => {
    // La forma del desglose es contrato con la pantalla; agregarle campos la
    // rompería en silencio.
    expect(Object.keys(buildAccuracyBreakdown(analizados))).not.toContain('matchesWithPoints')
    expect(countScoringPredictions(analizados)).toBe(3)
  })

  it('devuelve todo en cero sin pronósticos', () => {
    expect(buildAccuracyBreakdown([])).toEqual({
      exactScores: 0,
      goalDiffCorrect: 0,
      winnerOnly: 0,
      winnerHits: 0,
      errors: 0,
      bonusGoals: 0,
      totalAnalyzed: 0,
    })
  })
})

describe('sumPoints', () => {
  it('suma los puntos tratando los nulos como cero', () => {
    expect(
      sumPoints([
        { match: partido(1, 0), prediction: pronostico(1, 0, 5) },
        { match: partido(1, 0), prediction: pronostico(0, 0, null) },
        { match: partido(1, 0), prediction: pronostico(0, 1, 2) },
      ])
    ).toBe(7)
  })

  it('es cero sin pronósticos', () => {
    expect(sumPoints([])).toBe(0)
  })
})
