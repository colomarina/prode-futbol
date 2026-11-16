import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Playoffs from './index'

let tournament = { id: 't1' }

const terminado = {
  is_finished: true,
  home_score: 1,
  away_score: 0,
  match_date: '2026-11-10T20:00:00Z',
}
const octavos = Array.from({ length: 8 }, (_, i) => ({
  id: `o${i + 1}`,
  playoff_stage: 'octavos',
  match_number: i + 1,
  is_playoff: true,
  home_team_id: `h${i}`,
  away_team_id: `a${i}`,
  home_team: { id: `h${i}`, name: `h${i}`, logo_url: null },
  away_team: { id: `a${i}`, name: `a${i}`, logo_url: null },
  qualifier_team_id: null,
  ...terminado,
}))
const MATCHES_BY_STAGE = {
  '32avos': [],
  '16avos': [],
  octavos,
  cuartos: [],
  semifinal: [],
  final: [],
}

vi.mock('../../contexts/TournamentContext', () => ({
  useTournament: () => ({ activeTournament: tournament }),
}))

vi.mock('../../hooks/usePlayoffs', () => ({
  usePlayoffs: () => ({
    matchesByStage: MATCHES_BY_STAGE,
    predictions: [],
    loading: false,
    error: null,
    hasAnyPlayoffMatches: true,
    fetchPlayoffs: () => {},
  }),
}))

describe('Playoffs', () => {
  it('al cambiar de torneo vuelve a abrir en la ronda en curso', () => {
    const { rerender } = render(<Playoffs />)
    fireEvent.click(screen.getByRole('tab', { name: 'Octavos' }))
    expect(screen.getByRole('tab', { name: 'Octavos' })).toHaveAttribute('aria-selected', 'true')

    tournament = { id: 't2' }
    rerender(<Playoffs />)

    expect(screen.getByRole('tab', { name: 'Cuartos' })).toHaveAttribute('aria-selected', 'true')
  })
})
