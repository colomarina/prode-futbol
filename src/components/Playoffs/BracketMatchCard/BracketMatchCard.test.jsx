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
