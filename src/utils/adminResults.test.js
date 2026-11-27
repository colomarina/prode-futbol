import { describe, it, expect } from 'vitest'
import { getPendingResultsRoundNumber, splitByResult } from './adminResults'

const NOW = new Date('2026-11-29T23:00:00Z')
const hoursAgo = hours => new Date(NOW.getTime() - hours * 3600 * 1000).toISOString()

const match = (round_number, hours, is_finished) => ({
  id: `${round_number}-${hours}-${is_finished}`,
  round_number,
  match_date: hoursAgo(hours),
  is_finished,
  is_playoff: true,
})

describe('getPendingResultsRoundNumber', () => {
  it('elige la fecha con un partido cargable sin resultado', () => {
    const meta = [match(17, 100, true), match(18, 3, false)]
    expect(getPendingResultsRoundNumber(meta, NOW)).toBe(18)
  })

  it('elige la fecha pendiente mas vieja', () => {
    const meta = [match(16, 200, false), match(18, 3, false)]
    expect(getPendingResultsRoundNumber(meta, NOW)).toBe(16)
  })

  it('sin pendientes cargables cae a la ultima fecha cargable', () => {
    const meta = [match(17, 100, true), match(18, 1, false)]
    expect(getPendingResultsRoundNumber(meta, NOW)).toBe(17)
  })

  it('sin partidos devuelve null', () => {
    expect(getPendingResultsRoundNumber([], NOW)).toBeNull()
  })
})

describe('splitByResult', () => {
  it('separa pendientes y cargados conservando el orden', () => {
    const a = { id: 'a', is_finished: false }
    const b = { id: 'b', is_finished: true }
    const c = { id: 'c', is_finished: false }
    expect(splitByResult([a, b, c])).toEqual({ pending: [a, c], loaded: [b] })
  })
})
