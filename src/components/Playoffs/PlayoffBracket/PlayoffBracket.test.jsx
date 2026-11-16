import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, within, act } from '@testing-library/react'
import PlayoffBracket from './index'

const PAST = '2026-11-10T20:00:00Z'

const m = (stage, number, home, away, extra = {}) => ({
  id: `${stage}-${number}`,
  playoff_stage: stage,
  match_number: number,
  is_playoff: true,
  home_team_id: home,
  away_team_id: away,
  home_team: { id: home, name: home, logo_url: null },
  away_team: { id: away, name: away, logo_url: null },
  home_score: null,
  away_score: null,
  qualifier_team_id: null,
  is_finished: false,
  match_date: '2099-01-01T20:00:00Z',
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

const octavos = (extra = () => ({})) =>
  Array.from({ length: 8 }, (_, i) => m('octavos', i + 1, `h${i + 1}`, `a${i + 1}`, extra(i)))

const renderBracket = matchesByStage =>
  render(<PlayoffBracket matchesByStage={matchesByStage} predictionsByMatch={{}} />)

describe('PlayoffBracket', () => {
  it('dibuja las rondas hasta la final con A confirmar', () => {
    renderBracket(stages({ octavos: octavos() }))

    const titulos = screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent)
    expect(titulos).toEqual(['Octavos de final', 'Cuartos de final', 'Semifinales', 'Final'])
  })

  it('conecta el cuadro solo si los cruces cierran', () => {
    const { container, unmount } = renderBracket(
      stages({ octavos: octavos(), cuartos: [m('cuartos', 1, 'h1', 'a2')] })
    )
    expect(container.querySelector('[data-connected]')).toHaveAttribute('data-connected', 'true')
    unmount()

    const otro = renderBracket(
      stages({ octavos: octavos(), cuartos: [m('cuartos', 1, 'h1', 'a4')] })
    )
    expect(otro.container.querySelector('[data-connected]')).toHaveAttribute(
      'data-connected',
      'false'
    )
  })

  it('abre en el celular la ronda en curso', () => {
    renderBracket(
      stages({
        octavos: octavos(() => ({
          is_finished: true,
          home_score: 1,
          away_score: 0,
          match_date: PAST,
        })),
      })
    )

    expect(screen.getByRole('tab', { name: 'Cuartos' })).toHaveAttribute('aria-selected', 'true')
  })

  it('muestra el tercer puesto aparte de la final', () => {
    const terminado = (home, away, date) => ({
      is_finished: true,
      home_score: home,
      away_score: away,
      match_date: date,
    })
    renderBracket(
      stages({
        semifinal: [
          m('semifinal', 1, 'francia', 'espana', terminado(0, 2, PAST)),
          m('semifinal', 2, 'inglaterra', 'argentina', terminado(1, 2, PAST)),
        ],
        final: [
          m('final', 1, 'francia', 'inglaterra', terminado(4, 6, '2026-11-11T20:00:00Z')),
          m('final', 2, 'espana', 'argentina', terminado(1, 0, '2026-11-12T20:00:00Z')),
        ],
      })
    )

    const titulos = screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent)
    expect(titulos).toEqual(['Semifinales', 'Final'])
    // Uno en el cuadro de escritorio y otro en la tab del celular.
    expect(screen.getAllByRole('heading', { level: 4, name: 'Tercer puesto' })).toHaveLength(2)

    // En el celular, la tab Final muestra primero la final y después el tercer puesto.
    const panel = screen.getByRole('tabpanel')
    const equipos = within(panel)
      .getAllByText(/^(espana|francia)$/)
      .map(el => el.textContent)
    expect(equipos).toEqual(['espana', 'francia'])
    expect(within(panel).getByText('Tercer puesto')).toBeInTheDocument()
  })

  it('lista la ronda elegida por horario', () => {
    const fechas = ['2099-01-03T20:00:00Z', '2099-01-01T20:00:00Z', '2099-01-02T20:00:00Z']
    renderBracket(
      stages({
        octavos: [1, 2, 3].map(n =>
          m('octavos', n, `local${n}`, `visita${n}`, { match_date: fechas[n - 1] })
        ),
      })
    )

    const panel = screen.getByRole('tabpanel')
    const locales = within(panel)
      .getAllByText(/^local\d$/)
      .map(el => el.textContent)
    expect(locales).toEqual(['local2', 'local3', 'local1'])
  })
})

describe('PlayoffBracket: accesibilidad y tiempo', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('el panel de la ronda entra en el orden de tabulación', () => {
    renderBracket(stages({ octavos: octavos() }))

    expect(screen.getByRole('tabpanel')).toHaveAttribute('tabindex', '0')
  })

  it('pasa a En juego cuando arranca el partido, sin pedir datos', () => {
    vi.useFakeTimers({ now: new Date('2026-11-16T12:00:00Z') })
    renderBracket(
      stages({ final: [m('final', 1, 'river', 'boca', { match_date: '2026-11-16T12:05:00Z' })] })
    )
    expect(screen.queryByText('En juego')).not.toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(5 * 60 * 1000)
    })

    expect(screen.getAllByText('En juego').length).toBeGreaterThan(0)
  })
})
