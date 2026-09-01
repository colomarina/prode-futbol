import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ErrorMessage from './index'

describe('ErrorMessage', () => {
  it('muestra el mensaje que le pasan', () => {
    render(<ErrorMessage error="No se pudo cargar la tabla" />)

    expect(screen.getByText('No se pudo cargar la tabla')).toBeInTheDocument()
  })

  it('sin mensaje cae a un texto generico en vez de quedar en blanco', () => {
    render(<ErrorMessage />)

    expect(screen.getByText('Ha ocurrido un error')).toBeInTheDocument()
  })

  it('con onRetry ofrece el boton y avisa al hacer click', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    render(<ErrorMessage error="Falló" onRetry={onRetry} />)

    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('sin onRetry no dibuja un boton que no haria nada', () => {
    render(<ErrorMessage error="Falló" />)

    expect(screen.queryByRole('button')).toBeNull()
  })

  it('el boton se alcanza con el teclado y se dispara con Enter', async () => {
    // El boton de antes resolvia el hover con dos handlers de mouse en
    // JavaScript, asi que quien llegaba tabulando no veia ninguna respuesta.
    const user = userEvent.setup()
    const onRetry = vi.fn()
    render(<ErrorMessage error="Falló" onRetry={onRetry} />)

    await user.tab()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toHaveFocus()

    await user.keyboard('{Enter}')
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
