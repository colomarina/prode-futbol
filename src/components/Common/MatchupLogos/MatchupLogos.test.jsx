import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MatchupLogos from './index'

const VELEZ = { id: 'vel', name: 'Vélez Sarsfield', slug: 'vel', logo_url: 'https://x/vel.png' }
const IND = { id: 'ind', name: 'Independiente', slug: 'ind', logo_url: 'https://x/ind.png' }

describe('MatchupLogos', () => {
  it('muestra el nombre completo, su abreviatura y el del medio', () => {
    render(<MatchupLogos home={VELEZ} away={IND} middle="vs" />)

    expect(screen.getByText('Vélez Sarsfield')).toBeInTheDocument()
    expect(screen.getByText('VÉL')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByText('Independiente')).toBeInTheDocument()
    expect(screen.getByText('vs')).toBeInTheDocument()
  })

  it('los escudos son decorativos porque el nombre ya esta escrito', () => {
    const { container } = render(<MatchupLogos home={VELEZ} away={IND} middle="vs" />)

    expect(container.querySelectorAll('img[alt=""]')).toHaveLength(2)
  })

  it('sin escudo muestra igual el nombre', () => {
    const { container } = render(
      <MatchupLogos home={{ ...VELEZ, logo_url: null }} away={IND} middle="1 - 0" />
    )

    expect(screen.getByText('Vélez Sarsfield')).toBeInTheDocument()
    expect(container.querySelectorAll('img')).toHaveLength(1)
  })

  it('sin equipo muestra un guion', () => {
    render(<MatchupLogos home={null} away={IND} middle="vs" />)

    expect(screen.getByText('-')).toBeInTheDocument()
  })
})
