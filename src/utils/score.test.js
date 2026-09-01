import { describe, it, expect } from 'vitest'
import { parseScoreValue, getWinnerTeamId } from './score'

const MATCH = { home_team_id: 'local', away_team_id: 'visitante' }

describe('parseScoreValue', () => {
  it('devuelve el numero cargado', () => {
    expect(parseScoreValue('3')).toBe(3)
    expect(parseScoreValue(0)).toBe(0)
  })

  it('un campo vacio es null y no cero', () => {
    // Number('') da 0: sin el guard, "todavia no cargue nada" se leeria como 0 goles.
    expect(parseScoreValue('')).toBeNull()
    expect(parseScoreValue(null)).toBeNull()
    expect(parseScoreValue(undefined)).toBeNull()
  })

  it('lo que no es numero es null', () => {
    expect(parseScoreValue('abc')).toBeNull()
  })
})

describe('getWinnerTeamId', () => {
  it('devuelve el equipo que hizo mas goles', () => {
    expect(getWinnerTeamId(2, 1, MATCH)).toBe('local')
    expect(getWinnerTeamId(1, 2, MATCH)).toBe('visitante')
  })

  it('el empate no tiene ganador', () => {
    // En un playoff lo define el clasificado, no el marcador.
    expect(getWinnerTeamId(1, 1, MATCH)).toBeNull()
    expect(getWinnerTeamId(0, 0, MATCH)).toBeNull()
  })

  it('sin los dos goles cargados no hay ganador', () => {
    expect(getWinnerTeamId(2, null, MATCH)).toBeNull()
    expect(getWinnerTeamId(null, null, MATCH)).toBeNull()
  })
})
