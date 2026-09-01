import { describe, it, expect } from 'vitest'
import { getFormPlaceholder } from './formPlaceholder'

const LISTA = [{ round_number: 1 }]

/** El caso feliz: todo cargado y con una fecha elegida. */
const listo = {
  roundsLoading: false,
  rounds: LISTA,
  matchesLoading: false,
  selectedRound: 1,
}

describe('getFormPlaceholder', () => {
  it('con todo cargado no muestra ninguna pantalla intermedia', () => {
    expect(getFormPlaceholder(listo)).toBeNull()
  })

  it('mientras cargan las fechas muestra el spinner general', () => {
    expect(getFormPlaceholder({ ...listo, roundsLoading: true })).toEqual({
      type: 'loading',
      message: 'Cargando información...',
    })
  })

  it('sin fechas avisa que las tiene que crear el administrador', () => {
    expect(getFormPlaceholder({ ...listo, rounds: [] })).toEqual({
      type: 'empty',
      title: 'No hay fechas disponibles',
      description: 'Esperá a que el administrador cree las fechas del torneo',
    })
  })

  it('trata un rounds ausente igual que una lista vacía', () => {
    expect(getFormPlaceholder({ ...listo, rounds: undefined })?.type).toBe('empty')
  })

  it('mientras cargan los partidos pide el esqueleto, no el spinner', () => {
    // Las fechas ya llegaron, así que el selector se puede mostrar: la pantalla no
    // se reemplaza entera, se reserva el lugar de las tarjetas. Antes acá venía
    // `{ type: 'loading', message: 'Cargando partidos...' }` y el spinner tapaba
    // también el selector.
    expect(getFormPlaceholder({ ...listo, matchesLoading: true })).toEqual({ type: 'skeleton' })
  })

  it('el esqueleto no trae mensaje: no hay ningún texto que mostrar', () => {
    expect(getFormPlaceholder({ ...listo, matchesLoading: true }).message).toBeUndefined()
  })

  it('con las fechas listas pero sin ninguna elegida espera a la auto-selección', () => {
    expect(getFormPlaceholder({ ...listo, selectedRound: null }).message).toBe(
      'Preparando información...'
    )
  })

  it('la carga de fechas gana sobre el resto', () => {
    // Sin fechas no puede haber partidos: preguntar al revés mostraría "no hay
    // fechas disponibles" en cada carga.
    expect(
      getFormPlaceholder({
        roundsLoading: true,
        rounds: [],
        matchesLoading: true,
        selectedRound: null,
      }).message
    ).toBe('Cargando información...')
  })

  it('la falta de fechas gana sobre la carga de partidos', () => {
    expect(
      getFormPlaceholder({
        roundsLoading: false,
        rounds: [],
        matchesLoading: true,
        selectedRound: null,
      }).type
    ).toBe('empty')
  })
})
