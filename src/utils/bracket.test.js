import { describe, it, expect } from 'vitest'
import { buildBracket, getCurrentStage, getNextChange, getPlayoffWinnerId } from './bracket'

const NOW = new Date('2026-11-16T12:00:00Z')
const PAST = '2026-11-10T20:00:00Z'
const FUTURE = '2026-11-30T20:00:00Z'

let nextId = 0

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
    expect(buildBracket(stages(), NOW)).toEqual({ rounds: [], thirdPlace: null, connected: false })
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

  it('una primera ronda cargada a medias respeta las posiciones y sigue conectada', () => {
    const octavos = octavosCompletos().filter(match => ![3, 5].includes(match.match_number))
    const { rounds, connected } = buildBracket(stages({ octavos }), NOW)

    expect(rounds.map(round => round.slots.length)).toEqual([8, 4, 2, 1])
    expect(rounds[0].slots.map(slot => slot.match?.match_number ?? null)).toEqual([
      1,
      2,
      null,
      4,
      null,
      6,
      7,
      8,
    ])
    expect(connected).toBe(true)
  })

  it('arranca en la primera ronda con partidos', () => {
    const dieciseisavos = Array.from({ length: 16 }, (_, i) => m('16avos', i + 1, `x${i}`, `y${i}`))
    const { rounds } = buildBracket(stages({ '16avos': dieciseisavos }), NOW)

    expect(rounds[0].stage).toBe('16avos')
    expect(rounds.at(-1).stage).toBe('final')
  })

  it('marca conectado un cuadro donde el cuarto i sale de los octavos 2i-1 y 2i', () => {
    const cuartos = [m('cuartos', 1, 'h1', 'a2'), m('cuartos', 3, 'a5', 'h6')]

    expect(buildBracket(stages({ octavos: octavosCompletos(), cuartos }), NOW).connected).toBe(true)
  })

  it('no conecta un cuadro numerado por horario, como el Apertura 2026', () => {
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

describe('buildBracket: de dónde sale un cruce sin cargar', () => {
  const ids = source => source.teams.map(team => team.id)

  it('muestra el ganador si el partido de origen terminó y los dos si no', () => {
    const octavos = octavosCompletos()
    octavos[0] = m('octavos', 1, 'h1', 'a1', finished(0, 2))
    const [, cuartos] = buildBracket(stages({ octavos }), NOW).rounds

    expect(cuartos.slots[0].sources.map(ids)).toEqual([['a1'], ['h2', 'a2']])
  })

  it('sin partido de origen conocido no muestra equipos', () => {
    const [, , semis] = buildBracket(stages({ octavos: octavosCompletos() }), NOW).rounds

    expect(semis.slots[0].sources.map(ids)).toEqual([[], []])
  })

  it('un cruce cargado no proyecta nada', () => {
    const cuartos = [m('cuartos', 1, 'h1', 'h2')]
    const [, round] = buildBracket(stages({ octavos: octavosCompletos(), cuartos }), NOW).rounds

    expect(round.slots[0].sources).toBeNull()
  })

  it('un cuadro que no cierra no inventa cruces', () => {
    const octavos = octavosCompletos()
    const cuartos = [m('cuartos', 1, 'h1', 'h4')]
    const [, round] = buildBracket(stages({ octavos, cuartos }), NOW).rounds

    expect(round.slots[1].sources).toBeNull()
  })
})

describe('buildBracket con el tercer puesto cargado como un segundo partido de final', () => {
  const semifinal = [
    m('semifinal', 1, 'francia', 'espana', finished(0, 2)),
    m('semifinal', 2, 'inglaterra', 'argentina', finished(1, 2)),
  ]

  it('lo separa de la final y el cuadro sigue conectado', () => {
    const final = [
      m(
        'final',
        1,
        'francia',
        'inglaterra',
        finished(4, 6, { match_date: '2026-07-18T21:00:00Z' })
      ),
      m('final', 2, 'espana', 'argentina', finished(1, 0, { match_date: '2026-07-19T19:00:00Z' })),
    ]
    const bracket = buildBracket(stages({ semifinal, final }), NOW)

    expect(bracket.rounds.at(-1).slots.map(slot => slot.match.home_team_id)).toEqual(['espana'])
    expect(bracket.thirdPlace.match.home_team_id).toBe('francia')
    expect(bracket.connected).toBe(true)
  })

  it('sin semis definidas, el tercer puesto es el que se juega primero', () => {
    const pendientes = semifinal.map(match => ({ ...match, is_finished: false }))
    const final = [
      m('final', 1, 'x', 'y', { match_date: '2026-07-19T19:00:00Z' }),
      m('final', 2, 'z', 'w', { match_date: '2026-07-18T21:00:00Z' }),
    ]
    const bracket = buildBracket(stages({ semifinal: pendientes, final }), NOW)

    expect(bracket.thirdPlace.match.home_team_id).toBe('z')
    expect(bracket.rounds.at(-1).slots.map(slot => slot.match.home_team_id)).toEqual(['x'])
  })

  it('con una sola final no hay tercer puesto', () => {
    const final = [m('final', 1, 'espana', 'argentina')]

    expect(buildBracket(stages({ semifinal, final }), NOW).thirdPlace).toBeNull()
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

describe('estado de un partido empezado', () => {
  const conFecha = date =>
    buildBracket(stages({ final: [m('final', 1, 'a', 'b', { match_date: date })] }), NOW).rounds[0]
      .slots[0].state

  it('en juego durante las primeras horas', () => {
    expect(conFecha('2026-11-16T11:00:00Z')).toBe('live')
  })

  it('pasado el plazo para cargar el resultado, queda pendiente', () => {
    expect(conFecha('2026-11-16T09:00:00Z')).toBe('awaiting-result')
  })
})

describe('getNextChange', () => {
  const bracketCon = dates =>
    buildBracket(
      stages({
        semifinal: dates.map((date, i) =>
          m('semifinal', i + 1, `h${i}`, `a${i}`, { match_date: date })
        ),
      }),
      NOW
    )

  it('es el próximo arranque o el próximo vencimiento, el que llegue antes', () => {
    const bracket = bracketCon(['2026-11-16T11:00:00Z', '2026-11-16T15:00:00Z'])

    expect(getNextChange(bracket, NOW)).toEqual(new Date('2026-11-16T13:00:00Z'))
  })

  it('sin nada por cambiar no hay próximo cambio', () => {
    const terminado = { is_finished: true, home_score: 1, away_score: 0, match_date: PAST }
    const bracket = buildBracket(stages({ final: [m('final', 1, 'a', 'b', terminado)] }), NOW)

    expect(getNextChange(bracket, NOW)).toBeNull()
  })
})

describe('connected exige cruces coherentes', () => {
  const terminado = (home, away) => ({
    is_finished: true,
    home_score: home,
    away_score: away,
    match_date: PAST,
  })

  it('no conecta si los dos equipos salen del mismo partido', () => {
    const cuartos = [m('cuartos', 1, 'h1', 'a1')]

    expect(buildBracket(stages({ octavos: octavosCompletos(), cuartos }), NOW).connected).toBe(
      false
    )
  })

  it('no conecta si pasó el que perdió', () => {
    const octavos = octavosCompletos()
    octavos[0] = m('octavos', 1, 'h1', 'a1', terminado(2, 0))
    const cuartos = [m('cuartos', 1, 'a1', 'h2')]

    expect(buildBracket(stages({ octavos, cuartos }), NOW).connected).toBe(false)
  })

  it('conecta si pasó el ganador, aunque el otro cruce no haya terminado', () => {
    const octavos = octavosCompletos()
    octavos[0] = m('octavos', 1, 'h1', 'a1', terminado(2, 0))
    const cuartos = [m('cuartos', 1, 'a2', 'h1')]

    expect(buildBracket(stages({ octavos, cuartos }), NOW).connected).toBe(true)
  })
})
