import { describe, it, expect } from 'vitest'
import { getPreviousTime, hasScheduleChanged, toDatetimeLocalValue } from './schedule'
import { formatMatchDateShort, formatMatchTime } from '../../utils/matchDate'

const ORIGINAL = '2026-11-28T23:00:00Z'

describe('getPreviousTime', () => {
  it('sin cambios no muestra nada', () => {
    expect(getPreviousTime(ORIGINAL, toDatetimeLocalValue(ORIGINAL))).toBeNull()
  })

  it('con otra hora devuelve la hora original', () => {
    expect(getPreviousTime(ORIGINAL, '2026-11-28T18:30')).toBe(formatMatchTime(ORIGINAL))
  })

  it('con el campo vacio no muestra nada', () => {
    expect(getPreviousTime(ORIGINAL, '')).toBeNull()
  })
})

describe('getPreviousTime con el valor que devuelve DateTimeInput', () => {
  it('volver a la hora original en formato ISO no muestra nada', () => {
    expect(getPreviousTime(ORIGINAL, new Date(ORIGINAL).toISOString())).toBeNull()
  })

  it('otra hora en formato ISO devuelve la hora original', () => {
    expect(getPreviousTime(ORIGINAL, '2026-11-28T23:30:00.000Z')).toBe(formatMatchTime(ORIGINAL))
  })
})

describe('hasScheduleChanged', () => {
  it('compara instantes y no textos', () => {
    expect(hasScheduleChanged(ORIGINAL, new Date(ORIGINAL).toISOString())).toBe(false)
    expect(hasScheduleChanged(ORIGINAL, toDatetimeLocalValue(ORIGINAL))).toBe(false)
    expect(hasScheduleChanged(ORIGINAL, '2026-11-29T00:00:00.000Z')).toBe(true)
    expect(hasScheduleChanged(ORIGINAL, undefined)).toBe(false)
  })
})

describe('getPreviousTime cuando cambia el dia', () => {
  it('muestra el dia y la hora originales', () => {
    expect(getPreviousTime(ORIGINAL, '2026-11-29T23:00:00.000Z')).toBe(
      `${formatMatchDateShort(ORIGINAL)} ${formatMatchTime(ORIGINAL)}`
    )
  })
})

describe('getPreviousTime decide el dia en hora argentina', () => {
  it('pasar de 20:00 a 21:30 del mismo sabado argentino muestra solo la hora', () => {
    expect(getPreviousTime(ORIGINAL, '2026-11-29T00:30:00.000Z')).toBe(formatMatchTime(ORIGINAL))
  })
})
