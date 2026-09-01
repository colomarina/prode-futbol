import { describe, it, expect } from 'vitest'
import {
  ROUND_STATUSES,
  ROUND_STATUS_ORDER,
  getRoundStatus,
  getFinishability,
  getProgressLevel,
  countByProgressLevel,
} from './roundStatus'

describe('getRoundStatus', () => {
  it('devuelve la etiqueta y el ícono de cada estado', () => {
    expect(getRoundStatus('open')).toEqual({ key: 'open', label: 'Abierta', icon: '🟢' })
    expect(getRoundStatus('finished')).toEqual({
      key: 'finished',
      label: 'Finalizada',
      icon: '✅',
    })
  })

  it('cada estado lleva su propia clave, que es la que va al data-status del CSS', () => {
    // Si la clave y el nombre de la propiedad se desincronizan, la tarjeta pierde
    // sus colores sin romper nada más.
    Object.entries(ROUND_STATUSES).forEach(([nombre, config]) => {
      expect(config.key).toBe(nombre)
    })
  })

  it('un estado desconocido cae en pending', () => {
    // El default de la columna en la base es 'closed', que no está en su propio
    // CHECK. Sin este fallback la tarjeta quedaba sin etiqueta.
    expect(getRoundStatus('closed')).toBe(ROUND_STATUSES.pending)
    expect(getRoundStatus(undefined)).toBe(ROUND_STATUSES.pending)
  })

  it('el orden del selector cubre todos los estados', () => {
    expect([...ROUND_STATUS_ORDER].sort()).toEqual(Object.keys(ROUND_STATUSES).sort())
  })
})

describe('getFinishability', () => {
  it('se puede finalizar cuando todos los partidos terminaron', () => {
    expect(getFinishability({ total: 5, finished: 5 })).toEqual({
      canFinish: true,
      reason: 'Todos los partidos están finalizados',
    })
  })

  it('no se puede finalizar con partidos sin cargar, y el motivo lleva el conteo', () => {
    expect(getFinishability({ total: 5, finished: 3 })).toEqual({
      canFinish: false,
      reason: 'Partidos finalizados: 3/5',
    })
  })

  it('una fecha sin partidos no se puede finalizar', () => {
    // Con la comparación cruda `finished >= total` un 0/0 daba "finalizable", y
    // el handler lo rechazaba después con otro mensaje.
    expect(getFinishability(undefined).canFinish).toBe(false)
    expect(getFinishability({ total: 0, finished: 0 })).toEqual({
      canFinish: false,
      reason: 'Esta fecha no tiene partidos cargados',
    })
  })
})

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
