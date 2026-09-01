import { describe, it, expect } from 'vitest'
import {
  AUTH_VIEWS,
  getAuthView,
  validateAuthForm,
  hasErrors,
  getActionLabel,
  formatCountdown,
} from './authViews'

const COMPLETO = {
  email: 'lucas@ejemplo.com',
  password: 'secreto',
  username: 'La Coloneta',
  fullName: 'Lucas Marina',
}

describe('getAuthView', () => {
  it('devuelve la config de cada vista', () => {
    expect(getAuthView('signup')).toBe(AUTH_VIEWS.signup)
    expect(getAuthView('reset')).toBe(AUTH_VIEWS.reset)
  })

  it('una vista desconocida cae en login', () => {
    expect(getAuthView('cualquiera')).toBe(AUTH_VIEWS.login)
    expect(getAuthView(undefined)).toBe(AUTH_VIEWS.login)
  })

  it('cada vista declara sus textos y qué campos pide', () => {
    Object.values(AUTH_VIEWS).forEach(config => {
      expect(config.subtitle).toBeTruthy()
      expect(config.action).toBeTruthy()
      expect(config.loadingAction).toBeTruthy()
      expect(typeof config.needsPassword).toBe('boolean')
      expect(typeof config.needsProfile).toBe('boolean')
    })
  })
})

describe('validateAuthForm', () => {
  it('no encuentra errores con todo completo', () => {
    expect(hasErrors(validateAuthForm('signup', COMPLETO))).toBe(false)
    expect(hasErrors(validateAuthForm('login', COMPLETO))).toBe(false)
    expect(hasErrors(validateAuthForm('reset', COMPLETO))).toBe(false)
  })

  it('login pide email y contraseña, y nada del perfil', () => {
    const errores = validateAuthForm('login', {})
    expect(errores.email).toBeTruthy()
    expect(errores.password).toBeTruthy()
    expect(errores.username).toBe('')
    expect(errores.fullName).toBe('')
  })

  it('registro pide además el equipo y el nombre completo', () => {
    const errores = validateAuthForm('signup', { email: 'a@b.com', password: 'x' })
    expect(errores.username).toBeTruthy()
    expect(errores.fullName).toBeTruthy()
  })

  it('recuperar contraseña pide solo el email', () => {
    const errores = validateAuthForm('reset', { email: 'a@b.com' })
    expect(hasErrors(errores)).toBe(false)
    expect(validateAuthForm('reset', {}).password).toBe('')
  })

  it('devuelve todos los errores juntos', () => {
    // Antes se mostraban de a uno: primero el del email, y solo después de
    // completarlo aparecía el de la contraseña.
    const errores = validateAuthForm('signup', {})
    expect(Object.values(errores).filter(Boolean)).toHaveLength(4)
  })

  it('un campo con solo espacios cuenta como vacío', () => {
    // Es el único caso que llega hasta acá: los inputs son `required`, así que el
    // navegador ya bloquea el vacío real.
    expect(validateAuthForm('login', { email: '   ', password: '  ' }).email).toBeTruthy()
  })
})

describe('getActionLabel', () => {
  it('cambia el texto del botón mientras espera respuesta', () => {
    expect(getActionLabel('login', false)).toBe('Ingresar')
    expect(getActionLabel('login', true)).toBe('Cargando...')
    expect(getActionLabel('reset', false)).toBe('Enviar enlace de recuperación')
    expect(getActionLabel('reset', true)).toBe('Enviando enlace...')
    expect(getActionLabel('signup', false)).toBe('Registrarse')
  })
})

describe('formatCountdown', () => {
  it('muestra mm:ss con dos dígitos', () => {
    expect(formatCountdown(300)).toBe('05:00')
    expect(formatCountdown(65)).toBe('01:05')
    expect(formatCountdown(9)).toBe('00:09')
    expect(formatCountdown(0)).toBe('00:00')
  })
})
