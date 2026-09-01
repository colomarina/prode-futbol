import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import LoadingState from './index'

describe('LoadingState', () => {
  it('muestra el mensaje y el spinner', () => {
    render(<LoadingState message="Cargando fechas..." />)

    expect(screen.getByText('Cargando fechas...')).toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Cargando' })).toBeInTheDocument()
  })

  it('el mensaje por defecto es "Cargando..."', () => {
    render(<LoadingState />)
    expect(screen.getByText('Cargando...')).toBeInTheDocument()
  })

  it('cada tamaño da un spinner distinto', () => {
    // Los cuatro pasos salen de agrupar los tamaños reales que había sueltos por
    // la app: 16, 20, 24, 48 y 56px, con bordes de 2.5, 3 y 4.
    const medidas = {}
    for (const size of ['xs', 'sm', 'md', 'lg']) {
      const { unmount } = render(<LoadingState size={size} />)
      medidas[size] = screen.getByRole('status').style.getPropertyValue('--spinner-size')
      unmount()
    }

    expect(medidas).toEqual({ xs: '16px', sm: '24px', md: '48px', lg: '56px' })
  })

  it('un tamaño que no existe cae en lg en vez de romperse', () => {
    render(<LoadingState size="gigante" />)
    expect(screen.getByRole('status').style.getPropertyValue('--spinner-size')).toBe('56px')
  })

  it('el color se le pasa al spinner', () => {
    render(<LoadingState color="var(--color-error)" />)
    expect(screen.getByRole('status').style.getPropertyValue('--spinner-color')).toBe(
      'var(--color-error)'
    )
  })
})
