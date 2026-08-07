import { describe, it, expect } from 'vitest'
import { compareByPoints, assignPositions } from './ranking'
import { filterHiddenPlayers, isHiddenPlayer } from '../constants/hiddenPlayers'

/**
 * Regresión: la posición que muestra Estadísticas tiene que coincidir con la de
 * la Tabla de Posiciones. Antes no coincidían por dos motivos independientes:
 *
 *  1. Cada pantalla ordenaba los empates con un criterio distinto (una sin
 *     desempate, la otra por id de usuario).
 *  2. `usePersonalStats` no aplicaba `filterHiddenPlayers`, así que contaba
 *     jugadores que la tabla no muestra.
 *
 * Estos tests reproducen las dos formas de agregar puntajes de cada hook sobre
 * los mismos datos y verifican que lleguen al mismo resultado.
 */

const ROUND_SCORES = [
  { user_id: 'u-ana', total_points: 12, profiles: { id: 'u-ana', full_name: 'Ana Gomez' } },
  { user_id: 'u-zoe', total_points: 12, profiles: { id: 'u-zoe', full_name: 'Zoe Diaz' } },
  { user_id: 'u-leo', total_points: 30, profiles: { id: 'u-leo', full_name: 'Leo Sanchez' } },
  { user_id: 'u-nico', total_points: 5, profiles: { id: 'u-nico', full_name: 'Nico Perez' } },
]

/** Como agrega useLeaderboard: por profiles.id, con los campos del perfil. */
const comoLeaderboard = scores => {
  const totals = new Map()

  scores.forEach(item => {
    if (!item?.profiles?.id) return
    const previous = totals.get(item.profiles.id)
    if (previous) {
      previous.total_points += item.total_points || 0
    } else {
      totals.set(item.profiles.id, {
        id: item.profiles.id,
        full_name: item.profiles.full_name,
        total_points: item.total_points || 0,
      })
    }
  })

  return filterHiddenPlayers(
    Array.from(totals.values()).sort(
      compareByPoints(
        entry => entry.total_points,
        entry => entry.id
      )
    )
  )
}

/** Como agrega usePersonalStats: por user_id, sin datos de perfil. */
const comoPersonalStats = (scores, userId) => {
  const visibles = scores.filter(
    score => String(score.user_id) === String(userId) || !isHiddenPlayer(score.profiles)
  )

  const totals = new Map()
  visibles.forEach(score => {
    const key = String(score.user_id)
    totals.set(key, (totals.get(key) || 0) + Number(score.total_points || 0))
  })

  return assignPositions(
    Array.from(totals.entries())
      .map(([id, totalPoints]) => ({ userId: id, totalPoints }))
      .sort(
        compareByPoints(
          entry => entry.totalPoints,
          entry => entry.userId
        )
      )
  )
}

describe('consistencia entre Tabla de Posiciones y Estadisticas', () => {
  it('da el mismo orden de jugadores', () => {
    const tabla = comoLeaderboard(ROUND_SCORES).map(e => e.id)
    const stats = comoPersonalStats(ROUND_SCORES, 'u-ana').map(e => e.userId)

    // 'Leo Sanchez' esta en la lista de ocultos, asi que no aparece en ninguna.
    expect(tabla).toEqual(['u-ana', 'u-zoe', 'u-nico'])
    expect(stats).toEqual(tabla)
  })

  it('coincide la posicion del usuario ante un empate', () => {
    const tabla = comoLeaderboard(ROUND_SCORES)
    const stats = comoPersonalStats(ROUND_SCORES, 'u-zoe')

    const posicionEnTabla = tabla.findIndex(e => e.id === 'u-zoe') + 1
    const posicionEnStats = stats.find(e => e.userId === 'u-zoe').position

    expect(posicionEnStats).toBe(posicionEnTabla)
    expect(posicionEnStats).toBe(2)
  })

  it('cuenta la misma cantidad de participantes', () => {
    const tabla = comoLeaderboard(ROUND_SCORES)
    const stats = comoPersonalStats(ROUND_SCORES, 'u-ana')

    // Antes stats contaba 4 y la tabla mostraba 3, porque solo la tabla filtraba.
    expect(stats).toHaveLength(tabla.length)
    expect(stats).toHaveLength(3)
  })

  it('no deja al usuario propio afuera aunque este oculto', () => {
    // Caso degenerado: si se lo filtrara, su pagina se quedaria sin posicion.
    const stats = comoPersonalStats(ROUND_SCORES, 'u-leo')

    expect(stats.find(e => e.userId === 'u-leo')).toBeDefined()
  })

  it('mantiene el mismo orden aunque la DB devuelva las filas al reves', () => {
    const alReves = [...ROUND_SCORES].reverse()

    expect(comoLeaderboard(alReves).map(e => e.id)).toEqual(
      comoLeaderboard(ROUND_SCORES).map(e => e.id)
    )
    expect(comoPersonalStats(alReves, 'u-ana')).toEqual(comoPersonalStats(ROUND_SCORES, 'u-ana'))
  })
})
