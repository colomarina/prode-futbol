import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import IconButton from './index'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('IconButton', () => {
  it('el label va a aria-label: es el nombre accesible del icono', () => {
    render(<IconButton label="Cerrar aviso">×</IconButton>)
    expect(screen.getByRole('button', { name: 'Cerrar aviso' })).toBeInTheDocument()
  })

  it('avisa por consola si falta el label', () => {
    // La razón de existir del componente: un icono sin nombre es un botón anónimo
    // para un lector de pantalla. El aviso es en desarrollo, para que se note al
    // escribirlo y no en una auditoría.
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<IconButton>×</IconButton>)
    expect(error).toHaveBeenCalledWith(expect.stringContaining('falta `label`'))
  })

  it('no avisa cuando el label está', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<IconButton label="Ver">👀</IconButton>)
    expect(error).not.toHaveBeenCalled()
  })

  it('el type por defecto es "button"', () => {
    render(<IconButton label="x">×</IconButton>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })
})
