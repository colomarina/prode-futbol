import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import QualifierPicker from './index'

const LOCAL = { id: 'local', name: 'Argentina' }
const VISITA = { id: 'visita', name: 'Brasil' }

const renderPicker = (props = {}) =>
  render(
    <QualifierPicker
      teams={[LOCAL, VISITA]}
      selectedTeamId={LOCAL.id}
      isLocked={false}
      canPredict
      onSelect={() => {}}
      {...props}
    />
  )

describe('QualifierPicker', () => {
  it('es un radiogroup con una opción por equipo', () => {
    renderPicker()
    expect(screen.getByRole('radiogroup', { name: /clasifica/ })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(2)
  })

  it('marca el equipo elegido y solo ese', () => {
    renderPicker({ selectedTeamId: VISITA.id })

    const [local, visita] = screen.getAllByRole('radio')
    expect(local).toHaveAttribute('aria-checked', 'false')
    expect(visita).toHaveAttribute('aria-checked', 'true')
    // El cartel de seleccionado aparece una sola vez.
    expect(screen.getAllByText('SELECCIONADO')).toHaveLength(1)
  })

  it('avisa qué equipo se eligió', async () => {
    const onSelect = vi.fn()
    renderPicker({ onSelect })

    await userEvent.click(screen.getByRole('radio', { name: /Brasil/ }))

    expect(onSelect).toHaveBeenCalledWith(VISITA.id)
  })

  it('explica que hay que elegir cuando se puede', () => {
    renderPicker()
    expect(screen.getByText(/Elegí quién pensás que clasifica/)).toBeInTheDocument()
  })

  it('bloqueado explica que el marcador ya definió al ganador', async () => {
    const onSelect = vi.fn()
    renderPicker({ isLocked: true, onSelect })

    expect(screen.getByText(/con ese marcador hay ganador directo/)).toBeInTheDocument()
    screen.getAllByRole('radio').forEach(radio => expect(radio).toBeDisabled())

    await userEvent.click(screen.getByRole('radio', { name: /Brasil/ }))
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('en solo lectura no se puede tocar y no hay instrucciones', () => {
    renderPicker({ canPredict: false })

    screen.getAllByRole('radio').forEach(radio => expect(radio).toBeDisabled())
    expect(screen.queryByText(/Elegí quién pensás/)).not.toBeInTheDocument()
    expect(screen.queryByText(/ganador directo/)).not.toBeInTheDocument()
  })

  it('sin nada elegido no marca ninguna opción', () => {
    renderPicker({ selectedTeamId: null })

    screen
      .getAllByRole('radio')
      .forEach(radio => expect(radio).toHaveAttribute('aria-checked', 'false'))
    expect(screen.queryByText('SELECCIONADO')).not.toBeInTheDocument()
  })
})
