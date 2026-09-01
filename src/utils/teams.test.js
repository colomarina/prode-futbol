import { describe, it, expect } from 'vitest'
import { resolveTeamById, resolveTeamName, resolvePredictedQualifierTeam } from './teams'

const LOCAL = { id: 'a', name: 'Racing' }
const VISITA = { id: 'b', name: 'Banfield' }

const PARTIDO = {
  home_team_id: 'a',
  away_team_id: 'b',
  home_team: LOCAL,
  away_team: VISITA,
  is_playoff: true,
}

describe('resolveTeamById', () => {
  it('encuentra local y visitante', () => {
    expect(resolveTeamById('a', PARTIDO)).toBe(LOCAL)
    expect(resolveTeamById('b', PARTIDO)).toBe(VISITA)
  })

  it('un id que no juega este partido es null', () => {
    expect(resolveTeamById('z', PARTIDO)).toBeNull()
  })

  it('tolera que falte el id o el partido', () => {
    expect(resolveTeamById(null, PARTIDO)).toBeNull()
    expect(resolveTeamById('a', null)).toBeNull()
  })
})

describe('resolveTeamName', () => {
  it('devuelve el nombre', () => {
    expect(resolveTeamName('a', PARTIDO)).toBe('Racing')
  })

  it('sin equipo definido avisa', () => {
    expect(resolveTeamName(null, PARTIDO)).toBe('Sin definir')
    expect(resolveTeamName('z', PARTIDO)).toBe('Sin definir')
  })

  it('si el id coincide pero el equipo no vino, dice el lado', () => {
    // Pasa cuando la consulta no embebió los equipos: el id está, el nombre no.
    const sinNombres = { ...PARTIDO, home_team: {}, away_team: {} }
    expect(resolveTeamName('a', sinNombres)).toBe('Local')
    expect(resolveTeamName('b', sinNombres)).toBe('Visitante')
  })
})

describe('resolvePredictedQualifierTeam', () => {
  it('con marcador definido gana el del marcador', () => {
    expect(resolvePredictedQualifierTeam({ home_prediction: 2, away_prediction: 1 }, PARTIDO)).toBe(
      LOCAL
    )
    expect(resolvePredictedQualifierTeam({ home_prediction: 0, away_prediction: 3 }, PARTIDO)).toBe(
      VISITA
    )
  })

  it('en empate manda el equipo elegido a dedo', () => {
    expect(
      resolvePredictedQualifierTeam(
        { home_prediction: 1, away_prediction: 1, qualifier_prediction_id: 'b' },
        PARTIDO
      )
    ).toBe(VISITA)
  })

  it('en empate sin elegido es null', () => {
    expect(
      resolvePredictedQualifierTeam({ home_prediction: 1, away_prediction: 1 }, PARTIDO)
    ).toBeNull()
  })

  it('no aplica si el partido no es de playoff', () => {
    const liga = { ...PARTIDO, is_playoff: false }
    expect(
      resolvePredictedQualifierTeam({ home_prediction: 2, away_prediction: 1 }, liga)
    ).toBeNull()
  })
})
