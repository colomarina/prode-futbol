import { describe, it, expect } from 'vitest'
import { buildBracket, getCurrentStage, getPlayoffWinnerId } from './bracket'

const NOW = new Date('2026-11-16T12:00:00Z')
const PAST = '2026-11-10T20:00:00Z'
const FUTURE = '2026-11-30T20:00:00Z'

let nextId = 0

/** Un partido de playoff mínimo: los equipos se identifican por su id. */
const m = (stage, number, home, away, extra = {}) => ({
  id: `m${++nextId}`,
  playoff_stage: stage,
  match_number: number,
  is_playoff: true,
  home_team_id: home,
  away_team_id: away,
  home_team: { id: home, name: home },
  away_team: { id: away, name: away },
  home_score: null,
  away_score: null,
  qualifier_team_id: null,
  is_finished: false,
  match_date: FUTURE,
  ...extra,
})

const finished = (homeScore, awayScore, extra = {}) => ({
  is_finished: true,
  home_score: homeScore,
  away_score: awayScore,
  match_date: PAST,
  ...extra,
})

const stages = (partial = {}) => ({
  '32avos': [],
  '16avos': [],
  octavos: [],
  cuartos: [],
  semifinal: [],
  final: [],
  ...partial,
})

const octavosCompletos = () =>
  Array.from({ length: 8 }, (_, i) => m('octavos', i + 1, `h${i + 1}`, `a${i + 1}`))

describe('getPlayoffWinnerId', () => {
  it('gana el de más goles', () => {
    expect(getPlayoffWinnerId(m('octavos', 1, 'a', 'b', finished(2, 1)))).toBe('a')
  })

  it('en empate gana el clasificado', () => {
    expect(
      getPlayoffWinnerId(m('octavos', 1, 'a', 'b', finished(1, 1, { qualifier_team_id: 'b' })))
    ).toBe('b')
  })

  it('empate sin clasificado cargado no tiene ganador', () => {
    expect(getPlayoffWinnerId(m('octavos', 1, 'a', 'b', finished(1, 1)))).toBeNull()
  })

  it('sin terminar no hay ganador', () => {
    expect(
      getPlayoffWinnerId(m('octavos', 1, 'a', 'b', { home_score: 2, away_score: 0 }))
    ).toBeNull()
  })
})

describe('buildBracket', () => {
  it('sin partidos no hay rondas', () => {
    expect(buildBracket(stages(), NOW)).toEqual({ rounds: [], connected: false })
  })

  it('completa las rondas futuras con A confirmar', () => {
    const { rounds } = buildBracket(stages({ octavos: octavosCompletos() }), NOW)

    expect(rounds.map(round => round.stage)).toEqual(['octavos', 'cuartos', 'semifinal', 'final'])
    expect(rounds.map(round => round.slots.length)).toEqual([8, 4, 2, 1])
    expect(rounds[1].slots.every(slot => slot.match === null && slot.state === null)).toBe(true)
  })

  it('pone cada partido en su posición del cuadro', () => {
    const cuartos = [m('cuartos', 1, 'h1', 'h2'), m('cuartos', 3, 'h5', 'h6')]
    const { rounds } = buildBracket(stages({ octavos: octavosCompletos(), cuartos }), NOW)

    expect(rounds[1].slots.map(slot => slot.match?.match_number ?? null)).toEqual([
      1,
      null,
      3,
      null,
    ])
  })

  it('arranca en la primera ronda con partidos', () => {
    const dieciseisavos = Array.from({ length: 16 }, (_, i) => m('16avos', i + 1, `x${i}`, `y${i}`))
    const { rounds } = buildBracket(stages({ '16avos': dieciseisavos }), NOW)

    expect(rounds[0].stage).toBe('16avos')
    expect(rounds.at(-1).stage).toBe('final')
  })

  it('marca conectado un cuadro que cierra', () => {
    // El cuarto 1 sale de los octavos 1 y 2; el cuarto 3, de los octavos 5 y 6.
    const cuartos = [m('cuartos', 1, 'h1', 'a2'), m('cuartos', 3, 'a5', 'h6')]

    expect(buildBracket(stages({ octavos: octavosCompletos(), cuartos }), NOW).connected).toBe(true)
  })

  it('no conecta un cuadro cuyos cruces no cierran', () => {
    // El Apertura 2026: el cuarto 1 fue Belgrano (octavo 1) contra Unión (octavo 4).
    const octavos = octavosCompletos()
    octavos[0] = m('octavos', 1, 'talleres', 'belgrano')
    octavos[3] = m('octavos', 4, 'ind-rivadavia', 'union')
    const cuartos = [m('cuartos', 1, 'belgrano', 'union')]

    expect(buildBracket(stages({ octavos, cuartos }), NOW).connected).toBe(false)
  })

  it('marca el estado y el ganador de cada partido', () => {
    const octavos = [
      m('octavos', 1, 'a', 'b', finished(0, 2)),
      m('octavos', 2, 'c', 'd', { match_date: '2026-11-16T11:30:00Z' }),
      m('octavos', 3, 'e', 'f'),
      m('octavos', 4, 'g', 'h'),
    ]
    const [round] = buildBracket(stages({ octavos }), NOW).rounds

    expect(round.slots.map(slot => slot.state)).toEqual([
      'finished',
      'live',
      'scheduled',
      'scheduled',
    ])
    expect(round.slots.map(slot => slot.winnerTeamId)).toEqual(['b', null, null, null])
  })
})

describe('getCurrentStage', () => {
  it('sin rondas no hay ronda en curso', () => {
    expect(getCurrentStage(buildBracket(stages(), NOW))).toBeNull()
  })

  it('es la primera ronda incompleta', () => {
    const octavos = octavosCompletos().map(match => ({ ...match, ...finished(1, 0) }))

    expect(getCurrentStage(buildBracket(stages({ octavos }), NOW))).toBe('cuartos')
  })

  it('con todo terminado es la final', () => {
    const semifinal = [
      m('semifinal', 1, 'a', 'b', finished(1, 0)),
      m('semifinal', 2, 'c', 'd', finished(1, 0)),
    ]
    const final = [m('final', 1, 'a', 'c', finished(2, 0))]

    expect(getCurrentStage(buildBracket(stages({ semifinal, final }), NOW))).toBe('final')
  })
})
