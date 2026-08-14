/**
 * Cómo se muestra la fecha y la hora de un partido.
 *
 * Había cinco lugares formateando a mano, y cuatro de ellos repetían el mismo
 * bloque de opciones de hora (`hour: '2-digit'`, `minute: '2-digit'`,
 * `hour12: false`, `timeZone: 'America/Argentina/Buenos_Aires'`).
 *
 * El que no lo repetía era el panel de horarios del admin, que formateaba **sin
 * `timeZone`**: usaba la zona del navegador. Para alguien que abriera el panel
 * desde otra zona, el horario de un partido no coincidía con el que veía el
 * jugador en la pantalla de pronósticos. Con la zona en un solo lugar, eso no
 * puede volver a pasar.
 */
import type { IsoDate } from '../types/domain'

/**
 * El prode se juega en Argentina y los `match_date` vienen en UTC, así que
 * siempre se muestra en hora argentina, no en la del dispositivo.
 */
export const ZONA_HORARIA = 'America/Argentina/Buenos_Aires'

const LOCALE = 'es-AR'

/**
 * La anotación no es decorativa: sin ella TypeScript infiere `hour: string` en vez
 * del literal `'2-digit'`, y `toLocaleTimeString` rechaza el objeto.
 */
const HORA: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: ZONA_HORARIA,
}

/**
 * Lo que aceptan los formateadores: lo que viene de la base, o un `Date` ya
 * calculado (`getResultLoadTime()` devuelve uno).
 */
type FechaFormateable = IsoDate | Date | number | null | undefined

/** Convierte a Date y avisa si el valor no sirve, en vez de mostrar "Invalid Date". */
const parsear = (value: FechaFormateable): Date | null => {
  if (!value) return null

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/** La hora en 24h: `20:30`. */
export const formatMatchTime = (value: FechaFormateable, fallback = ''): string => {
  const date = parsear(value)
  return date ? date.toLocaleTimeString(LOCALE, HORA) : fallback
}

/** Fecha corta con día de la semana: `vie, 14 ago`. */
export const formatMatchDateShort = (value: FechaFormateable, fallback = ''): string => {
  const date = parsear(value)
  if (!date) return fallback

  return date.toLocaleDateString(LOCALE, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: ZONA_HORARIA,
  })
}

/** Fecha numérica con día de la semana: `vie 14/08`. La usa la llave. */
export const formatMatchDateNumeric = (value: FechaFormateable, fallback = ''): string => {
  const date = parsear(value)
  if (!date) return fallback

  return date.toLocaleDateString(LOCALE, {
    day: '2-digit',
    month: '2-digit',
    weekday: 'short',
    timeZone: ZONA_HORARIA,
  })
}

/**
 * Fecha y hora completas: `viernes, 14 de agosto de 2026, 20:30`.
 *
 * Los mensajes de "sin horario" e "inválido" están acá porque el panel del admin
 * los necesita: es la única pantalla donde un partido puede no tener fecha.
 */
export const formatMatchDateTimeLong = (value: FechaFormateable): string => {
  if (!value) return 'Sin horario asignado'

  const date = parsear(value)
  if (!date) return 'Horario inválido'

  return date.toLocaleString(LOCALE, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...HORA,
  })
}
