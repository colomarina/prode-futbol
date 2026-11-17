import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import BracketMatchCard from './index'
import { formatMatchTime } from '../../../utils/matchDate'

const match = (extra = {}) => ({
  id: 'm1',
  playoff_stage: 'octavos',
  match_number: 1,
  is_playoff: true,
  home_team_id: 'river',
  away_team_id: 'lanus',
  home_team: { id: 'river', name: 'River Plate', logo_url: null },
  away_team: { id: 'lanus', name: 'Lanús', logo_url: null },
  home_score: null,
  away_score: null,
  qualifier_team_id: null,
  is_finished: false,
  match_date: '2026-11-22T22:00:00Z',
  ...extra,
})

const prediction = (extra = {}) => ({
  match_id: 'm1',
  home_prediction: 2,
  away_prediction: 1,
  points: 3,
  qualifier_prediction_id: null,
  ...extra,
})

describe('BracketMatchCard', () => {
  it('muestra A confirmar en un slot vacío', () => {
    render(<BracketMatchCard slot={{ match: null, state: null, winnerTeamId: null }} />)

    expect(screen.getAllByText('A confirmar')).toHaveLength(2)
  })

  it('en un cruce sin cargar muestra de dónde sale cada lado', () => {
    const velez = { id: 'velez', name: 'Vélez', logo_url: null }
    const river = { id: 'river', name: 'River Plate', logo_url: null }
    const lanus = { id: 'lanus', name: 'Lanús', logo_url: null }
    render(
      <BracketMatchCard
        slot={{
          match: null,
          state: null,
          winnerTeamId: null,
          sources: [{ teams: [velez] }, { teams: [river, lanus] }],
        }}
      />
    )

    expect(screen.getByText('Vélez')).toBeInTheDocument()
    expect(screen.getByText('River Plate o Lanús')).toBeInTheDocument()
    expect(screen.queryByText('A confirmar')).not.toBeInTheDocument()
  })

  it('sin origen conocido sigue diciendo A confirmar', () => {
    render(
      <BracketMatchCard
        slot={{
          match: null,
          state: null,
          winnerTeamId: null,
          sources: [{ teams: [] }, { teams: [] }],
        }}
      />
    )

    expect(screen.getAllByText('A confirmar')).toHaveLength(2)
  })

  it('marca al ganador con texto, no solo color', () => {
    const slot = {
      match: match({ is_finished: true, home_score: 2, away_score: 0 }),
      state: 'finished',
      winnerTeamId: 'river',
    }
    render(<BracketMatchCard slot={slot} />)

    const filaGanador = screen.getByText('River Plate').closest('[data-result]')
    expect(filaGanador).toHaveAttribute('data-result', 'winner')
    expect(within(filaGanador).getByText('clasificado')).toBeInTheDocument()
    expect(screen.getByText('Lanús').closest('[data-result]')).toHaveAttribute(
      'data-result',
      'loser'
    )
  })

  it('muestra Clasificó por penales en un empate', () => {
    const slot = {
      match: match({
        is_finished: true,
        home_score: 1,
        away_score: 1,
        qualifier_team_id: 'lanus',
      }),
      state: 'finished',
      winnerTeamId: 'lanus',
    }
    render(<BracketMatchCard slot={slot} />)

    expect(screen.getByText('Clasificó por penales')).toBeInTheDocument()
  })

  it('muestra el horario de un partido programado', () => {
    render(<BracketMatchCard slot={{ match: match(), state: 'scheduled', winnerTeamId: null }} />)

    expect(
      screen.getByText(new RegExp(formatMatchTime('2026-11-22T22:00:00Z')))
    ).toBeInTheDocument()
  })

  it('dice En juego y no muestra puntos', () => {
    render(
      <BracketMatchCard
        slot={{ match: match(), state: 'live', winnerTeamId: null }}
        prediction={prediction()}
      />
    )

    expect(screen.getByText('En juego')).toBeInTheDocument()
    expect(screen.queryByText(/pts/)).not.toBeInTheDocument()
  })

  it('muestra el pronóstico y los puntos al terminar', () => {
    const slot = {
      match: match({ is_finished: true, home_score: 2, away_score: 1 }),
      state: 'finished',
      winnerTeamId: 'river',
    }
    render(<BracketMatchCard slot={slot} prediction={prediction()} />)

    expect(screen.getByText('Tu pronóstico: 2-1')).toBeInTheDocument()
    expect(screen.getByText('+3 pts')).toBeInTheDocument()
  })

  it('marca si acertaste el clasificado en un empate', () => {
    const slot = {
      match: match({ is_finished: true, home_score: 1, away_score: 1, qualifier_team_id: 'lanus' }),
      state: 'finished',
      winnerTeamId: 'lanus',
    }
    render(
      <BracketMatchCard
        slot={slot}
        prediction={prediction({
          home_prediction: 0,
          away_prediction: 0,
          qualifier_prediction_id: 'river',
        })}
      />
    )

    expect(screen.getByText(/Elegiste: River Plate/)).toHaveTextContent('❌')
  })

  it('marca el clasificado acertado aunque el partido no termine empatado', () => {
    const slot = {
      match: match({ is_finished: true, home_score: 2, away_score: 0, qualifier_team_id: 'river' }),
      state: 'finished',
      winnerTeamId: 'river',
    }
    render(
      <BracketMatchCard
        slot={slot}
        prediction={prediction({
          home_prediction: 1,
          away_prediction: 1,
          qualifier_prediction_id: 'river',
        })}
      />
    )

    expect(screen.getByText(/Elegiste: River Plate/)).toHaveTextContent('✅')
  })

  it('dice Resultado pendiente si venció el plazo y no hay resultado', () => {
    render(
      <BracketMatchCard slot={{ match: match(), state: 'awaiting-result', winnerTeamId: null }} />
    )

    expect(screen.getByText('Resultado pendiente')).toBeInTheDocument()
  })

  it('no habla de penales si el marcador no está cargado', () => {
    const slot = {
      match: match({ is_finished: true, qualifier_team_id: 'river' }),
      state: 'finished',
      winnerTeamId: 'river',
    }
    render(<BracketMatchCard slot={slot} />)

    expect(screen.queryByText('Clasificó por penales')).not.toBeInTheDocument()
  })
})

describe('BracketMatchCard en versus', () => {
  const terminado = (home, away, extra = {}) =>
    match({ is_finished: true, home_score: home, away_score: away, ...extra })

  it('el marcador se anuncia como 2 a 1', () => {
    render(
      <BracketMatchCard
        layout="versus"
        slot={{ match: terminado(2, 1), state: 'finished', winnerTeamId: 'river' }}
      />
    )

    const centro = screen.getByTestId('versus-center')
    expect(within(centro).getByText('2 - 1')).toHaveAttribute('aria-hidden', 'true')
    expect(within(centro).getByText('2 a 1')).toBeInTheDocument()
  })

  it('vs no lleva texto de marcador para el lector', () => {
    render(
      <BracketMatchCard
        layout="versus"
        slot={{ match: match(), state: 'scheduled', winnerTeamId: null }}
      />
    )

    const centro = screen.getByTestId('versus-center')
    expect(centro).toHaveTextContent(/^vs$/)
    expect(within(centro).queryByText(/ a /)).not.toBeInTheDocument()
  })

  it('un cruce sin cargar con nombres largos se puede leer entero', () => {
    const gimnasia = { id: 'gimnasia', name: 'Gimnasia y Esgrima La Plata', logo_url: null }
    const velez = { id: 'velez', name: 'Vélez Sarsfield', logo_url: null }
    render(
      <BracketMatchCard
        layout="versus"
        slot={{
          match: null,
          state: null,
          winnerTeamId: null,
          sources: [{ teams: [gimnasia, velez] }, { teams: [] }],
        }}
      />
    )

    const nombre = screen.getByText('Gimnasia y Esgrima La Plata o Vélez Sarsfield')
    expect(nombre).toHaveAttribute('title', 'Gimnasia y Esgrima La Plata o Vélez Sarsfield')
    expect(nombre).toHaveAttribute('data-lines', '3')
  })

  it('muestra el marcador entre los dos equipos al terminar', () => {
    const { container } = render(
      <BracketMatchCard
        layout="versus"
        slot={{ match: terminado(2, 1), state: 'finished', winnerTeamId: 'river' }}
      />
    )

    expect(screen.getByTestId('versus-center')).toHaveTextContent('2 - 1')
    expect(screen.getByText('River Plate')).toBeInTheDocument()
    expect(screen.getByText('Lanús')).toBeInTheDocument()
    expect(container.querySelector('article')).toHaveAttribute('data-layout', 'versus')
  })

  it('muestra vs si el partido no terminó', () => {
    const partido = match()
    render(
      <BracketMatchCard
        layout="versus"
        slot={{ match: partido, state: 'scheduled', winnerTeamId: null }}
      />
    )

    expect(screen.getByTestId('versus-center')).toHaveTextContent('vs')
    expect(screen.getByText(new RegExp(formatMatchTime(partido.match_date)))).toBeInTheDocument()
  })

  it('marca al ganador con texto', () => {
    render(
      <BracketMatchCard
        layout="versus"
        slot={{ match: terminado(2, 1), state: 'finished', winnerTeamId: 'river' }}
      />
    )

    const marcas = screen.getAllByText('clasificado')
    expect(marcas).toHaveLength(1)
    expect(marcas[0].closest('[data-result="winner"]')).toHaveTextContent('River Plate')
  })

  it('en un cruce sin cargar muestra de dónde sale cada lado', () => {
    const river = { id: 'river', name: 'River Plate', logo_url: null }
    const lanus = { id: 'lanus', name: 'Lanús', logo_url: null }
    render(
      <BracketMatchCard
        layout="versus"
        slot={{
          match: null,
          state: null,
          winnerTeamId: null,
          sources: [{ teams: [river, lanus] }, { teams: [] }],
        }}
      />
    )

    expect(screen.getByText('River Plate o Lanús')).toBeInTheDocument()
    expect(screen.getByText('A confirmar')).toBeInTheDocument()
    expect(screen.getByTestId('versus-center')).toHaveTextContent('vs')
  })

  it('no habla de penales sin marcador ni con empate sin clasificado', () => {
    const { unmount } = render(
      <BracketMatchCard
        layout="versus"
        slot={{ match: match({ is_finished: true }), state: 'finished', winnerTeamId: null }}
      />
    )
    expect(screen.queryByText('Clasificó por penales')).not.toBeInTheDocument()
    unmount()

    render(
      <BracketMatchCard
        layout="versus"
        slot={{ match: terminado(1, 1), state: 'finished', winnerTeamId: null }}
      />
    )
    expect(screen.queryByText('Clasificó por penales')).not.toBeInTheDocument()
  })

  it('muestra el pronóstico igual que la tarjeta apilada', () => {
    render(
      <BracketMatchCard
        layout="versus"
        slot={{ match: terminado(2, 1), state: 'finished', winnerTeamId: 'river' }}
        prediction={prediction()}
      />
    )

    expect(screen.getByText('Tu pronóstico: 2-1')).toBeInTheDocument()
    expect(screen.getByText('+3 pts')).toBeInTheDocument()
  })
})
