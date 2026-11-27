import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import RoundProgress from './index'

const player = (id, name, predictedCount, missingMatches) => ({
  id,
  name,
  totalMatches: 4,
  predictedCount,
  missingMatches,
  progress: (predictedCount / 4) * 100,
  roundNumber: 18,
})

const PLAYERS = [
  player('a', 'Ana', 4, []),
  player('b', 'Beto', 2, [3, 4]),
  player('c', 'Caro', 0, [1, 2, 3, 4]),
]

describe('RoundProgress', () => {
  it('muestra a todos los jugadores sin desplegar nada, los que mas les falta primero', () => {
    render(<RoundProgress players={PLAYERS} matchLabels={{}} />)

    expect(screen.queryByRole('button', { name: /detalles/i })).toBeNull()
    const nombres = screen.getAllByText(/^(Ana|Beto|Caro)$/).map(el => el.textContent)
    expect(nombres).toEqual(['Caro', 'Beto', 'Ana'])
  })

  it('muestra el cruce que falta y cae al numero si no lo conoce', () => {
    render(<RoundProgress players={[PLAYERS[1]]} matchLabels={{ 4: 'Boca vs Gimnasia' }} />)

    expect(screen.getByText('Boca vs Gimnasia')).toBeInTheDocument()
    expect(screen.getByText('#3')).toBeInTheDocument()
  })
})
