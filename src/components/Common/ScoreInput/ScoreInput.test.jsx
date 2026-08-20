import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ScoreInput, { ScoreSeparator } from './index'

describe('ScoreInput, editable', () => {
  it('es un input numérico que no abre el teclado alfabético en móvil', () => {
    render(<ScoreInput value="" onChange={() => {}} />)
    const input = screen.getByRole('textbox')

    // `type="tel"` + inputMode numeric: en móvil abre el teclado de números sin
    // los spinners que trae `type="number"`.
    expect(input).toHaveAttribute('type', 'tel')
    expect(input).toHaveAttribute('inputmode', 'numeric')
  })

  it('avisa los cambios', () => {
    const onChange = vi.fn()
    render(<ScoreInput value="" onChange={onChange} />)

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '3' } })
    expect(onChange).toHaveBeenCalled()
  })

  it('al enfocarlo selecciona lo que ya hay, para poder sobrescribir de una', () => {
    render(<ScoreInput value="2" onChange={() => {}} />)
    const input = screen.getByRole('textbox')
    const select = vi.spyOn(input, 'select')

    fireEvent.focus(input)
    expect(select).toHaveBeenCalled()
  })

  it('pasa los props sueltos, como disabled', () => {
    render(<ScoreInput value="1" onChange={() => {}} disabled />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })
})

describe('ScoreInput, solo lectura', () => {
  it('deja de ser un input', () => {
    // Cuando el partido ya empezó no hay nada que editar: un input deshabilitado
    // seguiría siendo tabulable y anunciándose como campo.
    render(<ScoreInput value="2" readOnly />)

    expect(screen.queryByRole('textbox')).toBeNull()
    expect(screen.getByText('2')).toBeInTheDocument()
  })
})

describe('tonos', () => {
  it('cada tono da una clase distinta', () => {
    const clases = new Set()
    for (const tone of ['primary', 'success', 'muted']) {
      const { unmount } = render(<ScoreInput value="1" onChange={() => {}} tone={tone} />)
      clases.add(screen.getByRole('textbox').className)
      unmount()
    }

    expect(clases.size).toBe(3)
  })
})

describe('ScoreInput, nombre accesible', () => {
  it('sin aria-label el nombre sale del placeholder, que no distingue una cajita de la otra', () => {
    // Este es el estado que habia y que se vio en el arbol de accesibilidad del
    // navegador: las dos cajitas de un partido se anunciaban "-". El test lo deja
    // escrito para que se entienda por que las pantallas pasan `aria-label`.
    render(<ScoreInput value="" onChange={() => {}} />)

    expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', '-')
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-label')
  })

  it('el aria-label que le pasa la pantalla llega al input', () => {
    // El nombre del equipo lo sabe la pantalla, no el componente, asi que lo unico
    // que se puede garantizar aca es que se reenvie.
    render(<ScoreInput value="" onChange={() => {}} aria-label="Goles de Aldosivi" />)

    expect(screen.getByRole('textbox', { name: 'Goles de Aldosivi' })).toBeInTheDocument()
  })
})

describe('ScoreSeparator', () => {
  it('es el guión entre los dos goles', () => {
    render(<ScoreSeparator />)
    expect(screen.getByText('-')).toBeInTheDocument()
  })

  it('queda fuera del arbol de accesibilidad', () => {
    // Es puntuacion entre dos campos que ya se anuncian con su nombre: leerlo solo
    // agrega un "guion" en el medio del marcador.
    const { container } = render(<ScoreSeparator />)

    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })
})
