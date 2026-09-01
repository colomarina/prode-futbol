import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MatchOutcome from './index'

const PARTIDO = {
  home_score: 2,
  away_score: 1,
  is_playoff: false,
  home_team_id: 'local',
  away_team_id: 'visita',
  home_team: { id: 'local', name: 'Argentina' },
  away_team: { id: 'visita', name: 'Brasil' },
}

const PRONOSTICO = { home_prediction: 2, away_prediction: 1, points: 5 }

describe('MatchOutcome', () => {
  it('muestra el resultado final', () => {
    render(<MatchOutcome match={PARTIDO} prediction={PRONOSTICO} />)
    expect(screen.getByText('2 - 1')).toBeInTheDocument()
  })

  it('muestra el pronóstico y los puntos que dio', () => {
    render(<MatchOutcome match={PARTIDO} prediction={PRONOSTICO} />)
    expect(screen.getByText('Tu pronóstico: 2 - 1')).toBeInTheDocument()
    expect(screen.getByText('5 pts')).toBeInTheDocument()
  })

  it('sin pronóstico muestra el resultado igual, sin el chip de puntos', () => {
    render(<MatchOutcome match={PARTIDO} prediction={null} />)
    expect(screen.getByText('2 - 1')).toBeInTheDocument()
    expect(screen.queryByText(/pts/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Tu pronóstico/)).not.toBeInTheDocument()
  })

  it('un pronóstico de cero puntos se muestra igual', () => {
    // El panel se pinta rojo pero el chip tiene que estar: "0 pts" es
    // información, y antes la condición `points > 0` decidía cuatro estilos por
    // separado.
    render(<MatchOutcome match={PARTIDO} prediction={{ ...PRONOSTICO, points: 0 }} />)
    expect(screen.getByText('0 pts')).toBeInTheDocument()
  })

  it('en un playoff muestra quién clasificó y si lo acertó', () => {
    const playoff = { ...PARTIDO, is_playoff: true, qualifier_team_id: 'local' }

    const { unmount } = render(
      <MatchOutcome
        match={playoff}
        prediction={{ ...PRONOSTICO, qualifier_prediction_id: 'local' }}
      />
    )
    expect(screen.getByText(/Clasificó: Argentina ✅/)).toBeInTheDocument()
    unmount()

    render(
      <MatchOutcome
        match={playoff}
        prediction={{ ...PRONOSTICO, qualifier_prediction_id: 'visita' }}
      />
    )
    expect(screen.getByText(/Clasificó: Argentina ❌/)).toBeInTheDocument()
  })

  it('sin pronóstico de clasificado no pone ni tilde ni cruz', () => {
    render(
      <MatchOutcome
        match={{ ...PARTIDO, is_playoff: true, qualifier_team_id: 'local' }}
        prediction={PRONOSTICO}
      />
    )
    const linea = screen.getByText(/Clasificó: Argentina/)
    expect(linea.textContent).not.toMatch(/[✅❌]/)
  })

  it('un partido que no es playoff no habla de clasificados', () => {
    render(<MatchOutcome match={PARTIDO} prediction={PRONOSTICO} />)
    expect(screen.queryByText(/Clasificó/)).not.toBeInTheDocument()
  })
})
