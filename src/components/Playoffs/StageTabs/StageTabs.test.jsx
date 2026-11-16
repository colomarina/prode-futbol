import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import StageTabs from './index'

const rounds = [
  { stage: 'octavos', label: 'Octavos de final', slots: [] },
  { stage: 'cuartos', label: 'Cuartos de final', slots: [] },
  { stage: 'semifinal', label: 'Semifinales', slots: [] },
  { stage: 'final', label: 'Final', slots: [] },
]

const renderTabs = (selected = 'octavos') => {
  const onSelect = vi.fn()
  render(<StageTabs rounds={rounds} selected={selected} onSelect={onSelect} panelId="panel" />)
  return onSelect
}

describe('StageTabs', () => {
  it('marca la ronda elegida y solo ella entra en el orden de tabulación', () => {
    renderTabs('cuartos')

    const elegida = screen.getByRole('tab', { name: 'Cuartos' })
    expect(elegida).toHaveAttribute('aria-selected', 'true')
    expect(elegida).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('tab', { name: 'Final' })).toHaveAttribute('tabindex', '-1')
  })

  it('usa nombres cortos para que entren todas las rondas en el celular', () => {
    renderTabs()

    expect(screen.getAllByRole('tab').map(tab => tab.textContent)).toEqual([
      'Octavos',
      'Cuartos',
      'Semis',
      'Final',
    ])
  })

  it('no se lleva el foco al montar', () => {
    renderTabs('cuartos')

    expect(document.body).toHaveFocus()
  })

  it('mueve la selección y el foco con las flechas', () => {
    const onSelect = renderTabs('octavos')

    fireEvent.keyDown(screen.getByRole('tab', { name: 'Octavos' }), { key: 'ArrowRight' })
    expect(onSelect).toHaveBeenLastCalledWith('cuartos')
    expect(screen.getByRole('tab', { name: 'Cuartos' })).toHaveFocus()

    fireEvent.keyDown(screen.getByRole('tab', { name: 'Octavos' }), { key: 'ArrowLeft' })
    expect(onSelect).toHaveBeenLastCalledWith('final')
  })

  it('Home y End van a la primera y la última ronda', () => {
    const onSelect = renderTabs('cuartos')
    const tab = screen.getByRole('tab', { name: 'Cuartos' })

    fireEvent.keyDown(tab, { key: 'End' })
    expect(onSelect).toHaveBeenLastCalledWith('final')

    fireEvent.keyDown(tab, { key: 'Home' })
    expect(onSelect).toHaveBeenLastCalledWith('octavos')
  })
})
