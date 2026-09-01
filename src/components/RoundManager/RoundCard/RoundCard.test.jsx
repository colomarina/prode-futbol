import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RoundCard from './index'

const fecha = (extra = {}) => ({ id: 'r1', round_number: 3, status: 'pending', ...extra })

const renderCard = (props = {}) =>
  render(
    <RoundCard
      round={fecha()}
      matchCount={{ total: 4, finished: 4 }}
      onChangeStatus={() => {}}
      onFinish={() => {}}
      {...props}
    />
  )

describe('RoundCard', () => {
  it('muestra el estado con su etiqueta', () => {
    renderCard({ round: fecha({ status: 'locked' }) })
    expect(screen.getByText('Bloqueada')).toBeInTheDocument()
  })

  it('muestra el conteo de partidos en cualquier estado, no solo en bloqueada', () => {
    // Antes el conteo vivía dentro del botón Finalizar, que aparece solo con la
    // fecha bloqueada: en una pendiente no había forma de verlo.
    renderCard({ round: fecha({ status: 'pending' }), matchCount: { total: 5, finished: 2 } })
    expect(screen.getByTitle('Partidos finalizados: 2/5')).toBeInTheDocument()
  })

  it('omite el conteo cuando la fecha no tiene partidos cargados', () => {
    renderCard({ matchCount: undefined })
    expect(screen.queryByTitle(/Partidos finalizados/)).not.toBeInTheDocument()
  })

  it('el selector de estado va con label accesible', () => {
    renderCard()
    expect(screen.getByRole('combobox', { name: /Estado de/ })).toBeInTheDocument()
  })

  it('avisa el estado elegido', async () => {
    const onChangeStatus = vi.fn()
    renderCard({ onChangeStatus })

    await userEvent.selectOptions(screen.getByRole('combobox'), 'open')

    expect(onChangeStatus).toHaveBeenCalledWith('open')
  })

  it('una fecha finalizada no se puede cambiar de estado', () => {
    renderCard({ round: fecha({ status: 'finished' }) })
    expect(screen.getByRole('combobox')).toBeDisabled()
  })

  it('el botón Finalizar aparece solo con la fecha bloqueada', () => {
    renderCard({ round: fecha({ status: 'open' }) })
    expect(screen.queryByRole('button', { name: /Finalizar/ })).not.toBeInTheDocument()

    renderCard({ round: fecha({ status: 'locked' }) })
    expect(screen.getByRole('button', { name: /Finalizar/ })).toBeInTheDocument()
  })

  it('no se puede finalizar con partidos sin cargar, y el motivo está a la vista', () => {
    renderCard({ round: fecha({ status: 'locked' }), matchCount: { total: 4, finished: 2 } })

    const boton = screen.getByRole('button', { name: /Finalizar/ })
    expect(boton).toBeDisabled()
    expect(boton).toHaveAttribute('title', 'Partidos finalizados: 2/4')
  })

  it('se puede finalizar con todos los partidos cargados', async () => {
    const onFinish = vi.fn()
    renderCard({ round: fecha({ status: 'locked' }), onFinish })

    const boton = screen.getByRole('button', { name: /Finalizar/ })
    expect(boton).toBeEnabled()
    await userEvent.click(boton)

    expect(onFinish).toHaveBeenCalledOnce()
  })
})
