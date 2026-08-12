import { describe, it, expect } from 'vitest'
import { getLeaderboardRounds, hasPlayoffMatches } from './leaderboardRounds'

const round = (roundNumber, extra = {}) => ({ round_number: roundNumber, ...extra })

const match = (roundNumber, { finished = true, playoff = false } = {}) => ({
  round_number: roundNumber,
  is_finished: finished,
  is_playoff: playoff,
})

describe('getLeaderboardRounds', () => {
  it('incluye una fecha jugada aunque su status siga en open', () => {
    // Caso Clausura 2026: la fecha 4 se jugó entera y quedó en `open`; el resto
    // están cargadas pero sin jugar. Filtrar por status la hacía desaparecer.
    const rounds = [
      round(4, { status: 'open' }),
      round(5, { status: 'pending' }),
      round(6, { status: 'pending' }),
    ]
    const matchesMeta = [
      match(4),
      match(4),
      match(5, { finished: false }),
      match(6, { finished: false }),
    ]

    const { individualRounds, showPlayoffs } = getLeaderboardRounds({ rounds, matchesMeta })

    expect(individualRounds.map(item => item.round_number)).toEqual([4])
    expect(individualRounds[0].id).toBe(4)
    expect(showPlayoffs).toBe(false)
  })

  it('muestra una fecha en curso con partidos ya finalizados', () => {
    const { individualRounds } = getLeaderboardRounds({
      rounds: [round(7)],
      matchesMeta: [match(7), match(7, { finished: false })],
    })

    expect(individualRounds.map(item => item.round_number)).toEqual([7])
  })

  it('deja las fechas de playoff fuera del listado individual y habilita su tabla', () => {
    // Caso Apertura 2026: liga con playoffs en las fechas 17 a 20.
    const rounds = [round(15), round(16), round(17), round(18)]
    const matchesMeta = [
      match(15),
      match(16),
      match(17, { playoff: true }),
      match(18, { playoff: true }),
    ]

    const { individualRounds, showPlayoffs } = getLeaderboardRounds({ rounds, matchesMeta })

    expect(individualRounds.map(item => item.round_number)).toEqual([16, 15])
    expect(showPlayoffs).toBe(true)
  })

  it('ordena de la fecha mas nueva a la mas vieja', () => {
    const { individualRounds } = getLeaderboardRounds({
      rounds: [round(1), round(2), round(3)],
      matchesMeta: [match(1), match(2), match(3)],
    })

    expect(individualRounds.map(item => item.round_number)).toEqual([3, 2, 1])
  })

  it('en el Mundial 16avos y octavos tienen tabla propia y el resto se agrega', () => {
    // Caso Mundial 2026: fase de grupos 1-3, playoffs 4-8, todas en `pending`.
    const rounds = [
      round(1, { status: 'pending' }),
      round(2, { status: 'pending' }),
      round(3, { status: 'pending' }),
      round(4, { status: 'pending', name: '16avos de Final' }),
      round(5, { status: 'pending', name: 'Octavos de Final' }),
      round(6, { status: 'pending', name: 'Cuartos de Final' }),
      round(7, { status: 'pending', name: 'Semifinal' }),
      round(8, { status: 'pending', name: 'Final' }),
    ]
    const matchesMeta = [
      match(1),
      match(2),
      match(3),
      match(4, { playoff: true }),
      match(5, { playoff: true }),
      match(6, { playoff: true }),
      match(7, { playoff: true }),
      match(8, { playoff: true }),
    ]

    const { individualRounds, showPlayoffs } = getLeaderboardRounds({
      rounds,
      matchesMeta,
      isWorldCupTournament: true,
    })

    expect(individualRounds.map(item => item.round_number)).toEqual([5, 4, 3, 2, 1])
    // El nombre sale de la fecha en la base, no de un literal en el componente.
    expect(individualRounds[0].name).toBe('Octavos de Final')
    expect(showPlayoffs).toBe(true)
  })

  it('en una liga las fechas 4 y 5 de playoff van a la tabla agregada', () => {
    const { individualRounds, showPlayoffs } = getLeaderboardRounds({
      rounds: [round(3), round(4), round(5)],
      matchesMeta: [match(3), match(4, { playoff: true }), match(5, { playoff: true })],
    })

    expect(individualRounds.map(item => item.round_number)).toEqual([3])
    expect(showPlayoffs).toBe(true)
  })

  it('no habilita la tabla de playoffs si esas fechas todavia no se jugaron', () => {
    const { showPlayoffs } = getLeaderboardRounds({
      rounds: [round(17)],
      matchesMeta: [match(17, { finished: false, playoff: true })],
    })

    expect(showPlayoffs).toBe(false)
  })

  it('sin partidos no hay ninguna fecha con tabla propia', () => {
    expect(getLeaderboardRounds({ rounds: [round(1), round(2)], matchesMeta: [] })).toEqual({
      individualRounds: [],
      showPlayoffs: false,
    })
  })

  it('tolera que todavia no hayan llegado los datos', () => {
    expect(getLeaderboardRounds()).toEqual({ individualRounds: [], showPlayoffs: false })
  })
})

describe('hasPlayoffMatches', () => {
  it('detecta playoffs aunque el partido no este finalizado', () => {
    expect(hasPlayoffMatches([match(17, { finished: false, playoff: true })])).toBe(true)
  })

  it('es false sin partidos de playoff', () => {
    expect(hasPlayoffMatches([match(1), match(2)])).toBe(false)
    expect(hasPlayoffMatches([])).toBe(false)
    expect(hasPlayoffMatches()).toBe(false)
  })
})
