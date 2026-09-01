import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Skeleton from './index'

describe('Skeleton', () => {
  it('queda fuera del arbol de accesibilidad', () => {
    // Es el contrato del componente: una docena de cajas vacias no le dicen nada a
    // un lector de pantalla, asi que la carga la anuncia quien lo usa con un
    // `role="status"`. Si esto cambia, los dos esqueletos de la app anuncian
    // basura.
    const { container } = render(<Skeleton />)

    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('toma el ancho y el alto que le pasan', () => {
    const { container } = render(<Skeleton width="60%" height="2rem" />)

    // jsdom resuelve el `rem` a pixeles con el root en 16px.
    expect(container.firstChild).toHaveStyle({ width: '60%', height: '32px' })
  })

  it('sin medidas ocupa todo el ancho disponible', () => {
    // Para que una fila siga al ancho de su celda sin que el consumidor lo calcule.
    const { container } = render(<Skeleton />)

    expect(container.firstChild).toHaveStyle({ width: '100%' })
  })

  it('circle lo redondea del todo', () => {
    const { container } = render(<Skeleton circle width="24px" height="24px" />)

    expect(container.firstChild).toHaveStyle({ borderRadius: 'var(--radius-circle)' })
  })

  it('el style del consumidor gana sobre los defaults', () => {
    const { container } = render(<Skeleton style={{ width: '10px' }} />)

    expect(container.firstChild).toHaveStyle({ width: '10px' })
  })
})
