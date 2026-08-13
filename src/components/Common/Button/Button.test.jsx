import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Button from './index'

describe('Button', () => {
  it('el type por defecto es "button" y no "submit"', () => {
    // Es el contrato que más importa: sin `type`, el navegador asume 'submit' y
    // cualquier botón adentro de un <form> lo envía sin que nadie lo pida.
    render(<Button>Guardar</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })

  it('se puede declarar submit cuando sí tiene que enviar', () => {
    render(<Button type="submit">Enviar</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })

  it('pasa el onClick y los props sueltos al botón', () => {
    const onClick = vi.fn()
    render(
      <Button onClick={onClick} disabled title="pista">
        Tocame
      </Button>
    )

    const boton = screen.getByRole('button')
    expect(boton).toBeDisabled()
    expect(boton).toHaveAttribute('title', 'pista')

    fireEvent.click(boton)
    expect(onClick).not.toHaveBeenCalled() // está deshabilitado
  })

  it('cada variante aplica una clase distinta', () => {
    const { rerender } = render(<Button variant="primary">x</Button>)
    const clasesPrimary = screen.getByRole('button').className

    rerender(<Button variant="danger">x</Button>)
    const clasesDanger = screen.getByRole('button').className

    expect(clasesPrimary).not.toBe(clasesDanger)
  })

  it('el tamaño md no agrega clase de tamaño, los otros sí', () => {
    const { rerender } = render(<Button size="md">x</Button>)
    const md = screen.getByRole('button').className

    rerender(<Button size="sm">x</Button>)
    expect(screen.getByRole('button').className).not.toBe(md)

    rerender(<Button size="lg">x</Button>)
    expect(screen.getByRole('button').className).not.toBe(md)
  })

  it('conserva el className que le pasan', () => {
    render(<Button className="mio">x</Button>)
    expect(screen.getByRole('button').className).toContain('mio')
  })

  it('fullWidth agrega su clase', () => {
    const { rerender } = render(<Button>x</Button>)
    const normal = screen.getByRole('button').className

    rerender(<Button fullWidth>x</Button>)
    expect(screen.getByRole('button').className).not.toBe(normal)
  })
})
