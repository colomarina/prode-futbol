import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ErrorBoundary from './index'

// React escribe el error en console.error aunque el boundary lo capture.
let consoleErrorSpy

beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  consoleErrorSpy.mockRestore()
})

const Explota = ({ error }) => {
  throw error
}

describe('ErrorBoundary', () => {
  it('renderiza los hijos cuando no hay error', () => {
    render(
      <ErrorBoundary>
        <p>Contenido normal</p>
      </ErrorBoundary>
    )

    expect(screen.getByText('Contenido normal')).toBeInTheDocument()
  })

  it('muestra el fallback ante un error de render', () => {
    render(
      <ErrorBoundary>
        <Explota error={new Error('boom')} />
      </ErrorBoundary>
    )

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Algo salio mal')).toBeInTheDocument()
  })

  it('permite personalizar el titulo del fallback', () => {
    render(
      <ErrorBoundary fallbackTitle="No pudimos cargar la tabla">
        <Explota error={new Error('boom')} />
      </ErrorBoundary>
    )

    expect(screen.getByText('No pudimos cargar la tabla')).toBeInTheDocument()
  })

  it('trata el fallo de carga de un chunk como version nueva y no ofrece reintentar', () => {
    // Caso real: se deploya mientras el usuario tiene la pestaña abierta.
    const chunkError = new Error('Failed to fetch dynamically imported module: /assets/x.js')

    render(
      <ErrorBoundary>
        <Explota error={chunkError} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Hay una version nueva')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Recargar pagina' })).toBeInTheDocument()
  })

  it('reintenta el render al tocar Reintentar', async () => {
    const user = userEvent.setup()

    /** Falla la primera vez y funciona en el reintento. */
    let debeFallar = true
    const Inestable = () => {
      if (debeFallar) throw new Error('boom')
      return <p>Ya anda</p>
    }

    render(
      <ErrorBoundary>
        <Inestable />
      </ErrorBoundary>
    )

    expect(screen.getByRole('alert')).toBeInTheDocument()

    debeFallar = false
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(screen.getByText('Ya anda')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
