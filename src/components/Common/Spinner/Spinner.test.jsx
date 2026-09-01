import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Spinner from './index'

describe('Spinner', () => {
  it('se anuncia como estado de carga', () => {
    render(<Spinner />)
    expect(screen.getByRole('status', { name: 'Cargando' })).toBeInTheDocument()
  })

  it('el tamaño y el borde entran como custom properties', () => {
    render(<Spinner size={24} borderWidth={3} />)
    const nodo = screen.getByRole('status')

    expect(nodo.style.getPropertyValue('--spinner-size')).toBe('24px')
    expect(nodo.style.getPropertyValue('--spinner-border')).toBe('3px')
  })

  it('la pista se deriva del color en vez de pedirse aparte', () => {
    // Antes la pista era `rgba(30, 127, 67, 0.1)` escrita a mano, o sea el verde
    // del tema base: en un torneo con otra paleta seguía siendo verde. Derivarla
    // hace imposible que se desincronice del color.
    render(<Spinner color="var(--color-error)" />)
    const nodo = screen.getByRole('status')

    expect(nodo.style.getPropertyValue('--spinner-color')).toBe('var(--color-error)')
    expect(nodo.style.getPropertyValue('--spinner-track')).toContain('var(--color-error)')
  })

  it('se puede pisar la pista si hace falta', () => {
    render(<Spinner trackColor="transparent" />)
    expect(screen.getByRole('status').style.getPropertyValue('--spinner-track')).toBe('transparent')
  })

  it('por defecto usa el primario del torneo', () => {
    render(<Spinner />)
    expect(screen.getByRole('status').style.getPropertyValue('--spinner-color')).toBe(
      'var(--color-primary)'
    )
  })
})
