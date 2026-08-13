import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Badge from './index'

describe('Badge', () => {
  it('renderiza su contenido', () => {
    render(<Badge>Partido #3</Badge>)
    expect(screen.getByText('Partido #3')).toBeInTheDocument()
  })

  it('cada tono da una clase distinta', () => {
    const clases = new Set()
    for (const tone of ['primary', 'success', 'error', 'warning', 'info', 'neutral']) {
      const { unmount } = render(<Badge tone={tone}>x</Badge>)
      clases.add(screen.getByText('x').className)
      unmount()
    }

    expect(clases.size).toBe(6)
  })

  it('la forma pill cambia el radio', () => {
    const { rerender } = render(<Badge>x</Badge>)
    const redondeado = screen.getByText('x').className

    rerender(<Badge shape="pill">x</Badge>)
    expect(screen.getByText('x').className).not.toBe(redondeado)
  })

  it('acepta style para los colores que no son una variante', () => {
    // El badge de grupo del Mundial recibe su par de colores de
    // `getGroupBadgeColors`, distinto por grupo: no se puede expresar como tono.
    render(
      <Badge tone="neutral" style={{ backgroundColor: 'rgb(1, 2, 3)', color: 'rgb(4, 5, 6)' }}>
        Grupo A
      </Badge>
    )

    const nodo = screen.getByText('Grupo A')
    expect(nodo.style.backgroundColor).toBe('rgb(1, 2, 3)')
    expect(nodo.style.color).toBe('rgb(4, 5, 6)')
  })

  it('conserva el className que le pasan', () => {
    render(<Badge className="mio">x</Badge>)
    expect(screen.getByText('x').className).toContain('mio')
  })

  it('es un span, no un botón: no es interactivo', () => {
    render(<Badge>x</Badge>)
    expect(screen.getByText('x').tagName).toBe('SPAN')
  })
})
