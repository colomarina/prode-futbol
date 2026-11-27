import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import LoadedResultRow from './index'

const team = (id, name) => ({ id, name, slug: id, logo_url: null })

describe('LoadedResultRow', () => {
  it('en un empate de playoff dice quién pasó', () => {
    const match = {
      id: 'm1',
      is_playoff: true,
      home_score: 2,
      away_score: 2,
      home_team: team('vel', 'Vélez Sarsfield'),
      away_team: team('bel', 'Belgrano'),
      qualifier_team: team('vel', 'Vélez Sarsfield'),
    }
    render(<LoadedResultRow match={match} />)

    expect(screen.getByText('2 - 2')).toBeInTheDocument()
    expect(screen.getByText('Pasa Vélez Sarsfield por penales')).toBeInTheDocument()
  })

  it('con ganador no aclara quién pasa', () => {
    const match = {
      id: 'm2',
      is_playoff: true,
      home_score: 3,
      away_score: 1,
      home_team: team('riv', 'River Plate'),
      away_team: team('lan', 'Lanús'),
      qualifier_team: team('riv', 'River Plate'),
    }
    render(<LoadedResultRow match={match} />)

    expect(screen.getByText('3 - 1')).toBeInTheDocument()
    expect(screen.queryByText(/pasa/)).toBeNull()
  })
})

describe('LoadedResultRow: accesibilidad y escudos', () => {
  const match = {
    id: 'm3',
    is_playoff: false,
    home_score: 3,
    away_score: 1,
    home_team: { id: 'riv', name: 'River Plate', slug: 'riv', logo_url: 'https://x/riv.png' },
    away_team: { id: 'lan', name: 'Lanús', slug: 'lan', logo_url: 'https://x/lan.png' },
    qualifier_team: null,
  }

  it('anuncia que el resultado esta cargado', () => {
    render(<LoadedResultRow match={match} />)

    expect(screen.getByRole('img', { name: 'Resultado cargado' })).toBeInTheDocument()
  })

  it('muestra los dos equipos con su nombre y escudo', () => {
    const { container } = render(<LoadedResultRow match={match} />)

    expect(screen.getByText('River Plate')).toBeInTheDocument()
    expect(screen.getByText('Lanús')).toBeInTheDocument()
    expect(container.querySelectorAll('img[alt=""]')).toHaveLength(2)
  })
})
