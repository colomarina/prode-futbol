/**
 * Los cuatro estados que puede tener una fecha, con su etiqueta y su ícono.
 *
 * Antes esto era un `getStatusConfig` que además devolvía tres colores por
 * estado, armados con `tint()` en JS. Los colores se fueron al CSS Module, que
 * los resuelve por `[data-status]`: son decisiones de estilo y en CSS se leen
 * todas juntas, en vez de estar interpoladas en doce `style={{}}`.
 *
 * Los valores tienen que coincidir con el CHECK de `rounds.status` en Supabase
 * (`pending|open|locked|finished`). Ver `docs/supabase-schema.md`.
 */
import type { PlayerProgress } from '../../hooks/useRoundProgress'
import type { RoundStatus } from '../../types/domain'

/** Cómo se muestra un estado de fecha. */
export interface RoundStatusConfig {
  key: RoundStatus
  label: string
  icon: string
}

export const ROUND_STATUSES: Record<RoundStatus, RoundStatusConfig> = {
  pending: { key: 'pending', label: 'Pendiente', icon: '⏳' },
  open: { key: 'open', label: 'Abierta', icon: '🟢' },
  locked: { key: 'locked', label: 'Bloqueada', icon: '🔒' },
  finished: { key: 'finished', label: 'Finalizada', icon: '✅' },
}

/** Orden en que se ofrecen en el selector: es el ciclo de vida de una fecha. */
export const ROUND_STATUS_ORDER: RoundStatus[] = ['pending', 'open', 'locked', 'finished']

/**
 * Un status desconocido cae en `pending`, que es el estado más inocuo: no
 * habilita pronósticos ni da por cerrada la fecha.
 *
 * Hace falta porque el default de la columna en la base es `'closed'`, un valor
 * que no está en su propio CHECK (ver la deuda de esquema en el plan).
 */
export const getRoundStatus = (status: string | null | undefined): RoundStatusConfig =>
  ROUND_STATUSES[status as RoundStatus] ?? ROUND_STATUSES.pending

/**
 * Si una fecha se puede finalizar, y el motivo para mostrar.
 *
 * Es la única definición de la regla, y antes había dos que podían discrepar: el
 * botón la evaluaba inline cinco veces (en el fondo, el cursor, el opacity, el
 * hover y el title) y el handler la volvía a evaluar con sus propios mensajes.
 * El `reason` sirve para las dos cosas: es el `title` del botón deshabilitado y
 * es el texto del toast si alguien igual lo dispara.
 *
 * @param roundMatches cuántos partidos tiene la fecha y cuántos terminaron
 * @returns {{canFinish: boolean, reason: string}}
 */
/** Cuántos partidos tiene una fecha y cuántos ya terminaron. */
export interface MatchCount {
  total: number
  finished: number
}

export const getFinishability = (
  roundMatches: MatchCount | undefined
): { canFinish: boolean; reason: string } => {
  if (!roundMatches || roundMatches.total === 0) {
    return { canFinish: false, reason: 'Esta fecha no tiene partidos cargados' }
  }

  const allFinished = roundMatches.finished >= roundMatches.total

  return {
    canFinish: allFinished,
    reason: allFinished
      ? 'Todos los partidos están finalizados'
      : `Partidos finalizados: ${roundMatches.finished}/${roundMatches.total}`,
  }
}

/**
 * En qué nivel de avance está un jugador en una fecha.
 *
 * Los tres niveles se usaban en dos lugares con criterios que no eran los
 * mismos: la fila del detalle decidía su borde con `progress === 100` /
 * `progress > 0`, y los contadores de arriba filtraban con `> 0 && < 100` /
 * `=== 0`. Con eso, los tres contadores no eran exhaustivos y un progreso raro
 * no aparecía en ninguno mientras la fila sí lo pintaba.
 */
/** Los tres niveles de progreso que muestra el panel. */
export type ProgressLevel = 'complete' | 'partial' | 'none'

export const getProgressLevel = (progress: number): ProgressLevel => {
  if (progress === 100) return 'complete'
  if (progress > 0) return 'partial'
  return 'none'
}

/** Cuántos jugadores hay en cada nivel. Alimenta las tres tarjetas del resumen. */
export const countByProgressLevel = (players: PlayerProgress[]): Record<ProgressLevel, number> => {
  const counts = { complete: 0, partial: 0, none: 0 }
  players.forEach(player => {
    counts[getProgressLevel(player.progress)] += 1
  })
  return counts
}
