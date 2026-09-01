import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useResetCooldown, RESET_COOLDOWN_MS, RESET_COOLDOWN_STORAGE_KEY } from './useResetCooldown'

const AHORA = new Date('2026-08-13T20:00:00.000Z')

beforeEach(() => {
  window.localStorage.clear()
  vi.useFakeTimers()
  vi.setSystemTime(AHORA)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useResetCooldown', () => {
  it('arranca sin espera', () => {
    const { result } = renderHook(() => useResetCooldown())
    expect(result.current.isOnCooldown).toBe(false)
    expect(result.current.remainingSeconds).toBe(0)
  })

  it('al arrancar la espera cuenta cinco minutos', () => {
    const { result } = renderHook(() => useResetCooldown())

    act(() => result.current.start())

    expect(RESET_COOLDOWN_MS).toBe(5 * 60 * 1000)
    expect(result.current.isOnCooldown).toBe(true)
    expect(result.current.remainingSeconds).toBe(300)
  })

  it('descuenta segundo a segundo', () => {
    const { result } = renderHook(() => useResetCooldown())
    act(() => result.current.start())

    act(() => vi.advanceTimersByTime(10_000))

    expect(result.current.remainingSeconds).toBe(290)
  })

  it('se apaga al vencer', () => {
    const { result } = renderHook(() => useResetCooldown())
    act(() => result.current.start())

    act(() => vi.advanceTimersByTime(RESET_COOLDOWN_MS))

    expect(result.current.isOnCooldown).toBe(false)
    expect(result.current.remainingSeconds).toBe(0)
    expect(window.localStorage.getItem(RESET_COOLDOWN_STORAGE_KEY)).toBeNull()
  })

  it('persiste la espera para que sobreviva un refresh', () => {
    // Sin esto, recargar la página salteaba el cooldown y Supabase rechazaba el
    // pedido con su propio límite, en inglés y sin decir cuánto falta.
    const primera = renderHook(() => useResetCooldown())
    act(() => primera.result.current.start())
    primera.unmount()

    vi.advanceTimersByTime(60_000)

    const segunda = renderHook(() => useResetCooldown())
    expect(segunda.result.current.isOnCooldown).toBe(true)
    expect(segunda.result.current.remainingSeconds).toBe(240)
  })

  it('una espera vencida en localStorage se limpia al montar', () => {
    window.localStorage.setItem(RESET_COOLDOWN_STORAGE_KEY, String(AHORA.getTime() - 1000))

    const { result } = renderHook(() => useResetCooldown())

    expect(result.current.isOnCooldown).toBe(false)
    expect(window.localStorage.getItem(RESET_COOLDOWN_STORAGE_KEY)).toBeNull()
  })

  it('un valor basura en localStorage no rompe nada', () => {
    window.localStorage.setItem(RESET_COOLDOWN_STORAGE_KEY, 'mañana')

    const { result } = renderHook(() => useResetCooldown())

    expect(result.current.isOnCooldown).toBe(false)
  })

  it('deja de contar al desmontarse', () => {
    // Si el intervalo sobreviviera, seguiría llamando a setState sobre un
    // componente desmontado.
    const limpiarIntervalo = vi.spyOn(window, 'clearInterval')
    const { result, unmount } = renderHook(() => useResetCooldown())
    act(() => result.current.start())

    unmount()

    expect(limpiarIntervalo).toHaveBeenCalled()
    limpiarIntervalo.mockRestore()
  })
})
