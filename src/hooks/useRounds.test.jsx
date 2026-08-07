import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createSupabaseMock } from '../test/supabaseMock'

const NOW = new Date('2026-08-07T20:00:00.000Z')
const HOUR = 60 * 60 * 1000

const ROUNDS_T1 = [
  { round_number: 1, status: 'finished', tournament_id: 't1' },
  { round_number: 2, status: 'open', tournament_id: 't1' },
]
const MATCHES_T1 = [
  { id: 'm1', round_number: 1, match_date: new Date(NOW.getTime() - 5 * HOUR).toISOString() },
  { id: 'm2', round_number: 2, match_date: new Date(NOW.getTime() + 3 * HOUR).toISOString() },
]

const ROUNDS_T2 = [{ round_number: 1, status: 'open', tournament_id: 't2' }]
const MATCHES_T2 = [
  { id: 'm9', round_number: 1, match_date: new Date(NOW.getTime() + 8 * HOUR).toISOString() },
]

let mock

vi.mock('../lib/supabase', () => ({
  get supabase() {
    return mock.supabase
  },
}))

/** Un cliente por test: sin retry y sin cache entre tests. */
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  })

  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  return { wrapper, queryClient }
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useRounds', () => {
  it('trae las fechas y deriva la activa desde los match_date', async () => {
    mock = createSupabaseMock({
      rounds: { data: ROUNDS_T1, error: null },
      matches: { data: MATCHES_T1, error: null },
    })
    const { wrapper } = createWrapper()
    const { useRounds } = await import('./useRounds')

    const { result } = renderHook(() => useRounds('t1'), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.rounds).toHaveLength(2)
    // La fecha 1 ya se jugó; la 2 todavía admite pronósticos.
    expect(result.current.activeRound?.round_number).toBe(2)
  })

  it('comparte el cache entre instancias del mismo torneo', async () => {
    mock = createSupabaseMock({
      rounds: { data: ROUNDS_T1, error: null },
      matches: { data: MATCHES_T1, error: null },
    })
    const { wrapper } = createWrapper()
    const { useRounds } = await import('./useRounds')

    // Tres instancias, como pasa cuando conviven varias pantallas.
    const { result } = renderHook(
      () => ({ a: useRounds('t1'), b: useRounds('t1'), c: useRounds('t1') }),
      { wrapper }
    )

    await waitFor(() => expect(result.current.a.loading).toBe(false))

    // Antes eran 2 queries por instancia. Ahora 1 de cada tabla en total.
    expect(mock.callsTo('rounds')).toBe(1)
    expect(mock.callsTo('matches')).toBe(1)

    expect(result.current.b.rounds).toEqual(result.current.a.rounds)
    expect(result.current.c.activeRound).toEqual(result.current.a.activeRound)
  })

  it('no mezcla datos entre torneos distintos', async () => {
    mock = createSupabaseMock({
      rounds: { data: ROUNDS_T1, error: null },
      matches: { data: MATCHES_T1, error: null },
    })
    const { wrapper } = createWrapper()
    const { useRounds } = await import('./useRounds')

    const { result, rerender } = renderHook(({ id }) => useRounds(id), {
      wrapper,
      initialProps: { id: 't1' },
    })

    await waitFor(() => expect(result.current.rounds).toHaveLength(2))

    // Cambiar de torneo tiene que pedir datos nuevos, no servir los cacheados.
    mock = createSupabaseMock({
      rounds: { data: ROUNDS_T2, error: null },
      matches: { data: MATCHES_T2, error: null },
    })
    rerender({ id: 't2' })

    await waitFor(() => expect(result.current.rounds).toHaveLength(1))
    expect(result.current.rounds[0].tournament_id).toBe('t2')
  })

  it('expone el error en vez de dejar la lista vacia en silencio', async () => {
    mock = createSupabaseMock({
      rounds: { data: null, error: { message: 'permission denied for table rounds' } },
      matches: { data: [], error: null },
    })
    const { wrapper } = createWrapper()
    const { useRounds } = await import('./useRounds')

    const { result } = renderHook(() => useRounds('t1'), { wrapper })

    await waitFor(() => expect(result.current.error).toBeTruthy())
    expect(result.current.error).toContain('permission denied')
    expect(result.current.rounds).toEqual([])
  })

  it('openNextRound avisa cuando no hay fechas pendientes', async () => {
    mock = createSupabaseMock({
      rounds: { data: ROUNDS_T1, error: null },
      matches: { data: MATCHES_T1, error: null },
    })
    const { wrapper } = createWrapper()
    const { useRounds } = await import('./useRounds')

    const { result } = renderHook(() => useRounds('t1'), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    // Ninguna de las dos fechas está en 'pending'.
    const { error } = await result.current.openNextRound()

    expect(error?.message).toBe('No hay fechas pendientes para abrir')
  })
})
