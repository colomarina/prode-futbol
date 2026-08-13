import { describe, it, expect } from 'vitest'
import {
  ZONA_HORARIA,
  formatMatchTime,
  formatMatchDateShort,
  formatMatchDateNumeric,
  formatMatchDateTimeLong,
} from './matchDate'

// 14 de agosto de 2026, 23:30 UTC = 20:30 en Argentina (UTC-3).
// La hora elegida cruza la medianoche en UTC a propósito: si alguien saca el
// `timeZone`, este test falla mostrando el día siguiente.
const PARTIDO = '2026-08-14T23:30:00.000Z'

describe('formatMatchTime', () => {
  it('muestra la hora argentina, no la UTC', () => {
    expect(formatMatchTime(PARTIDO)).toBe('20:30')
  })

  it('usa 24 horas', () => {
    // 22:00 en Argentina; con hour12 daría "10:00 p. m.".
    expect(formatMatchTime('2026-08-15T01:00:00.000Z')).toBe('22:00')
  })

  it('sin valor devuelve el fallback', () => {
    expect(formatMatchTime(null)).toBe('')
    expect(formatMatchTime('', '-')).toBe('-')
    expect(formatMatchTime('no es una fecha', '-')).toBe('-')
  })
})

describe('formatMatchDateShort', () => {
  it('da el dia argentino y no el UTC', () => {
    // En UTC ya es el 14 a las 23:30, pero en Argentina siguen siendo las 20:30
    // del 14. El caso que rompe es al revés: un partido a las 22:00 locales.
    expect(formatMatchDateShort(PARTIDO)).toContain('14')
  })

  it('un partido de noche no se pasa al dia siguiente', () => {
    // 2026-08-15T02:00Z son las 23:00 del 14 en Argentina.
    const texto = formatMatchDateShort('2026-08-15T02:00:00.000Z')
    expect(texto).toContain('14')
    expect(texto).not.toContain('15')
  })
})

describe('formatMatchDateNumeric', () => {
  it('usa dos digitos y trae el dia de la semana', () => {
    // El separador lo pone el locale: `es-AR` con `2-digit` da `14-08`, con
    // guión y no con barra. No se afirma sobre eso, solo sobre los números.
    const texto = formatMatchDateNumeric(PARTIDO)
    expect(texto).toMatch(/14\D08/)
    expect(texto).toMatch(/vie/)
  })
})

describe('formatMatchDateTimeLong', () => {
  it('incluye fecha y hora', () => {
    const texto = formatMatchDateTimeLong(PARTIDO)
    expect(texto).toContain('2026')
    expect(texto).toContain('20:30')
  })

  it('distingue sin horario de horario invalido', () => {
    // El panel del admin necesita los dos mensajes: un partido puede no tener
    // fecha asignada todavía.
    expect(formatMatchDateTimeLong(null)).toBe('Sin horario asignado')
    expect(formatMatchDateTimeLong('cualquier cosa')).toBe('Horario inválido')
  })
})

describe('ZONA_HORARIA', () => {
  it('esta definida en un solo lugar', () => {
    expect(ZONA_HORARIA).toBe('America/Argentina/Buenos_Aires')
  })
})
