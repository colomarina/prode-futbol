import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PasswordInput from './index'

describe('PasswordInput', () => {
  it('arranca oculto', () => {
    render(<PasswordInput value="secreto" onChange={() => {}} />)

    expect(document.querySelector('input')).toHaveAttribute('type', 'password')
    expect(screen.getByRole('button', { name: 'Mostrar contraseña' })).toBeInTheDocument()
  })

  it('el ojo alterna entre mostrar y ocultar', async () => {
    render(<PasswordInput value="secreto" onChange={() => {}} />)

    await userEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }))

    expect(document.querySelector('input')).toHaveAttribute('type', 'text')
    const boton = screen.getByRole('button', { name: 'Ocultar contraseña' })
    expect(boton).toHaveAttribute('aria-pressed', 'true')

    await userEvent.click(boton)
    expect(document.querySelector('input')).toHaveAttribute('type', 'password')
  })

  it('el ojo no envía el formulario que lo contiene', async () => {
    // Sin `type="button"` sería un submit: tocar el ojo mandaría el login.
    const onSubmit = vi.fn(event => event.preventDefault())
    render(
      <form onSubmit={onSubmit}>
        <PasswordInput value="x" onChange={() => {}} />
      </form>
    )

    await userEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }))

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('pasa el resto de las props al input', () => {
    render(
      <PasswordInput
        id="nueva"
        value=""
        onChange={() => {}}
        placeholder="Mínimo 6 caracteres"
        minLength={6}
        required
      />
    )

    const input = screen.getByPlaceholderText('Mínimo 6 caracteres')
    expect(input).toHaveAttribute('id', 'nueva')
    expect(input).toHaveAttribute('minlength', '6')
    expect(input).toBeRequired()
  })

  it('avisa lo que se tipea', async () => {
    const onChange = vi.fn()
    render(<PasswordInput value="" onChange={onChange} />)

    await userEvent.type(document.querySelector('input'), 'a')

    expect(onChange).toHaveBeenCalled()
  })

  it('cada campo tiene su propio ojo', async () => {
    // Dos instancias en la misma pantalla, como en el perfil: mostrar una no
    // muestra la otra.
    render(
      <>
        <PasswordInput id="a" value="uno" onChange={() => {}} />
        <PasswordInput id="b" value="dos" onChange={() => {}} />
      </>
    )

    await userEvent.click(screen.getAllByRole('button', { name: 'Mostrar contraseña' })[0])

    const inputs = document.querySelectorAll('input')
    expect(inputs[0]).toHaveAttribute('type', 'text')
    expect(inputs[1]).toHaveAttribute('type', 'password')
  })
})
