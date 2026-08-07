import { describe, it, expect } from 'vitest'
import { isTestTournament, filterVisibleTournaments } from './tournamentAccess'

const REAL = { slug: 'clausura-2026', name: 'Clausura 2026', status: 'active' }
const MUNDIAL = { slug: 'mundial-2026', name: 'Mundial 2026', status: 'active' }
const TEST = { slug: 'test-sandbox', name: 'Pruebas', status: 'active' }

describe('isTestTournament', () => {
  it('reconoce los slugs con el prefijo', () => {
    expect(isTestTournament(TEST)).toBe(true)
    expect(isTestTournament({ slug: 'test-loquesea' })).toBe(true)
  })

  it('no marca torneos reales', () => {
    expect(isTestTournament(REAL)).toBe(false)
    expect(isTestTournament(MUNDIAL)).toBe(false)
  })

  it('no confunde un slug que solo contiene "test"', () => {
    // El prefijo tiene que estar al principio, no en cualquier lado.
    expect(isTestTournament({ slug: 'protesta-2026' })).toBe(false)
    expect(isTestTournament({ slug: 'contest-2026' })).toBe(false)
  })

  it('tolera torneos sin slug', () => {
    expect(isTestTournament({})).toBe(false)
    expect(isTestTournament(null)).toBe(false)
    expect(isTestTournament(undefined)).toBe(false)
    expect(isTestTournament({ slug: null })).toBe(false)
  })
})

describe('filterVisibleTournaments', () => {
  const todos = [REAL, TEST, MUNDIAL]

  it('le oculta los de prueba a quien no es admin', () => {
    expect(filterVisibleTournaments(todos, false)).toEqual([REAL, MUNDIAL])
  })

  it('se los muestra al admin', () => {
    expect(filterVisibleTournaments(todos, true)).toEqual(todos)
  })

  it('conserva el orden original', () => {
    expect(filterVisibleTournaments(todos, false).map(t => t.slug)).toEqual([
      'clausura-2026',
      'mundial-2026',
    ])
  })

  it('tolera listas vacias o nulas', () => {
    expect(filterVisibleTournaments([], false)).toEqual([])
    expect(filterVisibleTournaments(null, false)).toEqual([])
    expect(filterVisibleTournaments(undefined, true)).toEqual([])
  })
})
