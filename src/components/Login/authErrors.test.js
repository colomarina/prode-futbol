import { describe, it, expect } from 'vitest'
import { toSpanishAuthError, GENERIC_AUTH_ERROR } from './authErrors'

describe('toSpanishAuthError', () => {
  it.each([
    ['Invalid login credentials', 'Email o contraseña incorrectos.'],
    ['Email not confirmed', 'Todavía no confirmaste tu email.'],
    ['User already registered', 'Ese email ya está registrado.'],
    ['Password should be at least 6 characters', 'La contraseña debe tener al menos 6 caracteres.'],
  ])('traduce "%s"', (mensaje, esperado) => {
    expect(toSpanishAuthError({ message: mensaje })).toBe(esperado)
  })

  it('traduce el límite de Supabase, que trae segundos variables en el mensaje', () => {
    // Por eso el match es por `includes` y no por igualdad.
    expect(
      toSpanishAuthError({
        message: 'For security purposes, you can only request this after 47 seconds.',
      })
    ).toBe('Ya enviamos un enlace hace poco. Esperá unos minutos para reenviar.')
  })

  it('no le importan las mayúsculas', () => {
    expect(toSpanishAuthError({ message: 'INVALID LOGIN CREDENTIALS' })).toBe(
      'Email o contraseña incorrectos.'
    )
  })

  it('lo que no conoce cae en un mensaje genérico', () => {
    // Nunca se muestra el error crudo de la API: no le dice nada al usuario y
    // puede filtrar detalles del backend.
    expect(toSpanishAuthError({ message: 'unexpected_failure: pgbouncer timeout' })).toBe(
      GENERIC_AUTH_ERROR
    )
  })

  it('tolera un error sin mensaje, null o undefined', () => {
    expect(toSpanishAuthError({})).toBe(GENERIC_AUTH_ERROR)
    expect(toSpanishAuthError(null)).toBe(GENERIC_AUTH_ERROR)
    expect(toSpanishAuthError(undefined)).toBe(GENERIC_AUTH_ERROR)
  })
})
