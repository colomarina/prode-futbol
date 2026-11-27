import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import MatchResult from './index'

const HACE_TRES_HORAS = new Date(Date.now() - 3 * 3600 * 1000).toISOString()

const MATCH = {
  id: 'm1',
  round_number: 18,
  match_number: 3,
  match_date: HACE_TRES_HORAS,
  is_finished: false,
  is_playoff: true,
  home_score: null,
  away_score: null,
  qualifier_team_id: null,
  home_team_id: 'rc',
  away_team_id: 'bc',
  home_team: { id: 'rc', name: 'Rosario Central', slug: 'rc', logo_url: null },
  away_team: { id: 'bc', name: 'Barracas Central', slug: 'bc', logo_url: null },
}

const SELECTOR = { name: 'Seleccionar equipo que clasifica' }

describe('MatchResult', () => {
  it('sin marcador no muestra el selector de penales', () => {
    render(<MatchResult match={MATCH} resultValues={{}} onValueChange={vi.fn()} />)

    expect(screen.queryByText(/quién clasifica por penales/)).toBeNull()
  })

  it('con empate muestra el selector de penales', () => {
    render(
      <MatchResult
        match={MATCH}
        resultValues={{ m1: { home: '1', away: '1' } }}
        onValueChange={vi.fn()}
      />
    )

    expect(screen.getByRole('radiogroup', SELECTOR)).toBeInTheDocument()
    expect(screen.getByText('Elegí quién clasificó por penales.')).toBeInTheDocument()
  })

  it('con ganador no muestra el selector y propone al ganador como clasificado', () => {
    const onValueChange = vi.fn()
    render(
      <MatchResult
        match={MATCH}
        resultValues={{ m1: { home: '2', away: '1' } }}
        onValueChange={onValueChange}
      />
    )

    expect(screen.queryByText(/quién clasifica por penales/)).toBeNull()
    expect(onValueChange).toHaveBeenCalledWith('m1', 'qualifier', 'rc')
  })
})
