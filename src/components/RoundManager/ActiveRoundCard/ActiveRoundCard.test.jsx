import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ActiveRoundCard from './index'

const ROUND = { id: 'r18', round_number: 18, name: 'Cuartos de Final' }

const renderCard = props =>
  render(
    <ActiveRoundCard
      round={ROUND}
      players={[]}
      matchLabels={{}}
      loading={false}
      error={false}
      {...props}
    />
  )

describe('ActiveRoundCard', () => {
  it('mientras carga el progreso muestra que esta cargando', () => {
    renderCard({ loading: true })

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('si el progreso fallo lo dice', () => {
    renderCard({ error: true })

    expect(screen.getByText('No se pudo cargar el progreso')).toBeInTheDocument()
  })

  it('si nadie pronostico todavia lo dice', () => {
    renderCard()

    expect(screen.getByText('Todavía nadie pronosticó esta fecha')).toBeInTheDocument()
  })
})
