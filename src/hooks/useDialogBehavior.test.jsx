import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import { useDialogBehavior, __dialogosAbiertos } from './useDialogBehavior'

/** Un diálogo mínimo, con dos botones para poder probar el ciclo del Tab. */
function Dialogo({ isOpen, onClose, id = 'd' }) {
  const { contenedorRef } = useDialogBehavior(isOpen, onClose)
  if (!isOpen) return null

  return (
    <div ref={contenedorRef} role="dialog" aria-label={id}>
      <button>{`${id}-primero`}</button>
      <button>{`${id}-ultimo`}</button>
    </div>
  )
}

beforeEach(() => {
  document.body.style.overflow = ''
})

describe('cierre con Escape', () => {
  it('llama a onClose', () => {
    const onClose = vi.fn()
    render(<Dialogo isOpen onClose={onClose} />)

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('no escucha si esta cerrado', () => {
    const onClose = vi.fn()
    render(<Dialogo isOpen={false} onClose={onClose} />)

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
  })
})

describe('bloqueo de scroll', () => {
  it('lo bloquea al abrir y lo devuelve al cerrar', () => {
    const { unmount } = render(<Dialogo isOpen onClose={() => {}} />)
    expect(document.body.style.overflow).toBe('hidden')

    unmount()
    expect(document.body.style.overflow).toBe('')
  })

  it('con dos dialogos abiertos, el primero que cierra NO devuelve el scroll', () => {
    // Es el bug que motiva el contador: antes cada cleanup escribía 'unset' a
    // ciegas, así que cerrar uno desbloqueaba el scroll con el otro abierto.
    const primero = render(<Dialogo isOpen onClose={() => {}} id="a" />)
    const segundo = render(<Dialogo isOpen onClose={() => {}} id="b" />)
    expect(__dialogosAbiertos()).toBe(2)

    primero.unmount()
    expect(document.body.style.overflow).toBe('hidden')

    segundo.unmount()
    expect(document.body.style.overflow).toBe('')
    expect(__dialogosAbiertos()).toBe(0)
  })

  it('respeta el overflow que ya tenia el body', () => {
    document.body.style.overflow = 'scroll'
    const { unmount } = render(<Dialogo isOpen onClose={() => {}} />)
    expect(document.body.style.overflow).toBe('hidden')

    unmount()
    expect(document.body.style.overflow).toBe('scroll')
  })
})

describe('foco', () => {
  it('al abrir, el foco entra al dialogo', () => {
    render(<Dialogo isOpen onClose={() => {}} />)
    expect(document.activeElement).toBe(screen.getByRole('dialog'))
  })

  it('al cerrar, el foco vuelve a donde estaba', () => {
    const disparador = document.createElement('button')
    document.body.appendChild(disparador)
    disparador.focus()
    expect(document.activeElement).toBe(disparador)

    const { unmount } = render(<Dialogo isOpen onClose={() => {}} />)
    expect(document.activeElement).not.toBe(disparador)

    unmount()
    expect(document.activeElement).toBe(disparador)
    disparador.remove()
  })

  it('el Tab cicla dentro del dialogo en vez de escaparse', () => {
    render(<Dialogo isOpen onClose={() => {}} />)
    const primero = screen.getByText('d-primero')
    const ultimo = screen.getByText('d-ultimo')

    // Desde el último, Tab vuelve al primero.
    ultimo.focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(document.activeElement).toBe(primero)

    // Desde el primero, Shift+Tab va al último.
    primero.focus()
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(ultimo)
  })
})
