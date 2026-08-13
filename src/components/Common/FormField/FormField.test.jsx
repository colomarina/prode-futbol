import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import FormField from './index'

describe('FormField, control único', () => {
  it('asocia la etiqueta con el control sin que nadie pase un id', () => {
    // Es la razón de existir: en la app había 23 <label> y solo 6 con htmlFor.
    // Acá el id lo genera el componente, así que no se puede olvidar.
    render(
      <FormField label="Nombre del equipo">
        <input />
      </FormField>
    )

    const input = screen.getByLabelText('Nombre del equipo')
    expect(input).toBeInTheDocument()
    expect(input.id).toBeTruthy()
  })

  it('dos campos en la misma pantalla no comparten id', () => {
    render(
      <>
        <FormField label="Uno">
          <input />
        </FormField>
        <FormField label="Dos">
          <input />
        </FormField>
      </>
    )

    expect(screen.getByLabelText('Uno').id).not.toBe(screen.getByLabelText('Dos').id)
  })

  it('el error se anuncia con aria-describedby y aria-invalid', () => {
    render(
      <FormField label="Email" error="No es un email válido">
        <input />
      </FormField>
    )

    const input = screen.getByLabelText('Email')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input.getAttribute('aria-describedby')).toBeTruthy()
    expect(screen.getByText('No es un email válido')).toBeInTheDocument()
  })

  it('sin error no ensucia el control con atributos vacíos', () => {
    render(
      <FormField label="Email">
        <input />
      </FormField>
    )

    const input = screen.getByLabelText('Email')
    expect(input).not.toHaveAttribute('aria-invalid')
    expect(input).not.toHaveAttribute('aria-describedby')
  })
})

describe('FormField, control envuelto', () => {
  it('con una función, el id llega donde el componente lo ponga', () => {
    // El campo de contraseña necesita esto: el input está envuelto junto al botón
    // del ojito, así que clonar el hijo le pondría el id al div.
    render(
      <FormField label="Contraseña">
        {id => (
          <div>
            <input id={id} />
            <button type="button">👁️</button>
          </div>
        )}
      </FormField>
    )

    expect(screen.getByLabelText('Contraseña').tagName).toBe('INPUT')
  })
})

describe('FormField, grupo', () => {
  it('con varios controles usa role=group en vez de un for imposible', () => {
    // Una etiqueta que nombra a dos controles no puede tener `htmlFor`: apunta a
    // uno solo. El patrón correcto es el grupo con aria-labelledby.
    render(
      <FormField label="Fecha y hora" group>
        <input aria-label="fecha" />
        <input aria-label="hora" />
      </FormField>
    )

    const grupo = screen.getByRole('group', { name: 'Fecha y hora' })
    expect(grupo).toBeInTheDocument()
    expect(grupo.querySelectorAll('input')).toHaveLength(2)
  })

  it('el grupo no genera un label con htmlFor', () => {
    render(
      <FormField label="Fecha y hora" group>
        <input />
      </FormField>
    )

    expect(document.querySelector('label')).toBeNull()
  })
})
