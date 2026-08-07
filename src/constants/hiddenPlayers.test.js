import { describe, it, expect } from 'vitest'
import { isHiddenPlayerName, isHiddenPlayer, filterHiddenPlayers } from './hiddenPlayers'

// El filtrado tiene que aplicarse igual en tabla de posiciones, pagos y stats:
// si un consumidor se lo saltea, los totales dejan de coincidir entre pantallas.

describe('isHiddenPlayerName', () => {
  it('detecta un nombre oculto exacto', () => {
    expect(isHiddenPlayerName('Ezequiel Cordoba')).toBe(true)
  })

  it('ignora mayusculas y espacios sobrantes', () => {
    expect(isHiddenPlayerName('  EZEQUIEL   CORDOBA  ')).toBe(true)
  })

  it('ignora tildes', () => {
    expect(isHiddenPlayerName('Ezequiel Córdoba')).toBe(true)
    expect(isHiddenPlayerName('Gerónimo García')).toBe(true)
  })

  it('detecta los tokens en cualquier orden', () => {
    expect(isHiddenPlayerName('Cordoba, Ezequiel')).toBe(true)
  })

  it('exige todos los tokens del grupo', () => {
    expect(isHiddenPlayerName('Ezequiel Perez')).toBe(false)
    expect(isHiddenPlayerName('Martin Cordoba')).toBe(false)
  })

  it('no oculta nombres que no estan en la lista', () => {
    expect(isHiddenPlayerName('Lucas Marina')).toBe(false)
  })

  it('trata los valores vacios como no ocultos', () => {
    expect(isHiddenPlayerName('')).toBe(false)
    expect(isHiddenPlayerName(null)).toBe(false)
    expect(isHiddenPlayerName(undefined)).toBe(false)
  })
})

describe('isHiddenPlayer', () => {
  it('revisa full_name, fullName, name y username', () => {
    expect(isHiddenPlayer({ full_name: 'Leo Sanchez' })).toBe(true)
    expect(isHiddenPlayer({ fullName: 'Leo Sanchez' })).toBe(true)
    expect(isHiddenPlayer({ name: 'Leo Sanchez' })).toBe(true)
    expect(isHiddenPlayer({ username: 'leo.sanchez' })).toBe(true)
  })

  it('alcanza con que un solo campo coincida', () => {
    expect(isHiddenPlayer({ username: 'jugador123', full_name: 'Jose Miner' })).toBe(true)
  })

  it('es falso para un jugador normal', () => {
    expect(isHiddenPlayer({ full_name: 'Lucas Marina', username: 'lucas' })).toBe(false)
  })

  it('tolera objetos vacios o nulos', () => {
    expect(isHiddenPlayer({})).toBe(false)
    expect(isHiddenPlayer(null)).toBe(false)
    expect(isHiddenPlayer(undefined)).toBe(false)
  })
})

describe('filterHiddenPlayers', () => {
  it('saca solo los jugadores ocultos y conserva el orden', () => {
    const list = [
      { full_name: 'Lucas Marina' },
      { full_name: 'Ezequiel Cordoba' },
      { full_name: 'Ana Gomez' },
      { full_name: 'Pablo Adrian' },
    ]

    expect(filterHiddenPlayers(list)).toEqual([
      { full_name: 'Lucas Marina' },
      { full_name: 'Ana Gomez' },
    ])
  })

  it('devuelve un array vacio para entradas nulas', () => {
    expect(filterHiddenPlayers(null)).toEqual([])
    expect(filterHiddenPlayers(undefined)).toEqual([])
    expect(filterHiddenPlayers([])).toEqual([])
  })

  it('no muta la lista original', () => {
    const list = [{ full_name: 'Ezequiel Cordoba' }, { full_name: 'Lucas Marina' }]
    filterHiddenPlayers(list)
    expect(list).toHaveLength(2)
  })
})
