import { describe, it, expect } from 'vitest'
import { buildMatchLabels, countByProgressLevel, getProgressLevel } from './progress'

describe('getProgressLevel', () => {
  it('separa completo, parcial y sin empezar', () => {
    expect(getProgressLevel(100)).toBe('complete')
    expect(getProgressLevel(50)).toBe('partial')
    expect(getProgressLevel(0.1)).toBe('partial')
    expect(getProgressLevel(0)).toBe('none')
  })
})

describe('countByProgressLevel', () => {
  it('cuenta los tres niveles', () => {
    expect(
      countByProgressLevel([
        { progress: 100 },
        { progress: 100 },
        { progress: 40 },
        { progress: 0 },
      ])
    ).toEqual({ complete: 2, partial: 1, none: 1 })
  })

  it('los tres contadores suman el total de jugadores', () => {
    // Antes no eran exhaustivos: "parcial" filtraba `> 0 && < 100` y "sin
    // empezar" `=== 0`, así que un progreso raro no caía en ninguno mientras la
    // fila del detalle sí lo pintaba.
    const jugadores = [
      { progress: 100 },
      { progress: 33.3 },
      { progress: 0 },
      { progress: NaN },
      { progress: 120 },
    ]
    const counts = countByProgressLevel(jugadores)
    expect(counts.complete + counts.partial + counts.none).toBe(jugadores.length)
  })

  it('sin jugadores devuelve los tres en cero', () => {
    expect(countByProgressLevel([])).toEqual({ complete: 0, partial: 0, none: 0 })
  })
})

describe('buildMatchLabels', () => {
  it('arma el cruce de cada partido por su numero', () => {
    const matches = [
      { match_number: 1, home_team: { name: 'Instituto' }, away_team: { name: 'River Plate' } },
      {
        match_number: 2,
        home_team: { name: 'Vélez Sarsfield' },
        away_team: { name: 'Independiente' },
      },
    ]
    expect(buildMatchLabels(matches)).toEqual({
      1: 'Instituto vs River Plate',
      2: 'Vélez Sarsfield vs Independiente',
    })
  })

  it('usa un signo de pregunta si falta un equipo', () => {
    const matches = [{ match_number: 3, home_team: null, away_team: { name: 'Barracas Central' } }]
    expect(buildMatchLabels(matches)).toEqual({ 3: '? vs Barracas Central' })
  })

  it('devuelve un objeto vacio sin partidos', () => {
    expect(buildMatchLabels([])).toEqual({})
  })
})
