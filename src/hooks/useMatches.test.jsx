import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createSupabaseMock } from '../test/supabaseMock'

const MATCHES = [
  { id: 'm1', round_number: 4, match_date: '2026-08-01T20:00:00.000Z' },
  { id: 'm2', round_number: 4, match_date: '2026-08-01T22:00:00.000Z' },
]

let mock

vi.mock('../lib/supabase', () => ({
  get supabase() {
    return mock.supabase
  },
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  })

  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  return wrapper
}

/**
 * La referencia de `matches` tiene que sobrevivir a un re-render.
 *
 * Regresión: el hook devolvía `data ?? []`, o sea un array nuevo cada vez que el
 * componente renderizaba. `AdminMatchSchedule` tiene un `useEffect` con
 * dependencia `[matches]` que setea estado, así que esa referencia nueva lo
 * volvía a disparar: setState → render → array nuevo → setState, hasta que React
 * cortaba con "Maximum update depth exceeded". Cualquier hook de datos que
 * devuelva un array o un objeto tiene que devolver siempre la misma referencia
 * mientras el contenido no cambie.
 */
describe('useMatches', () => {
  it('mantiene la referencia de matches con la query deshabilitada', async () => {
    mock = createSupabaseMock({ matches: { data: MATCHES, error: null } })
    const { useMatches } = await import('./useMatches')

    // Sin fecha la query no corre, así que `data` queda en undefined: es el caso
    // que disparaba el bucle al entrar al panel de horarios.
    const { result, rerender } = renderHook(() => useMatches(null, 't1'), {
      wrapper: createWrapper(),
    })

    const primera = result.current.matches
    rerender()
    rerender()

    expect(result.current.matches).toBe(primera)
    expect(result.current.matches).toEqual([])
    expect(mock.callsTo('matches')).toBe(0)
  })

  it('mantiene la referencia de matches con los datos ya resueltos', async () => {
    mock = createSupabaseMock({ matches: { data: MATCHES, error: null } })
    const { useMatches } = await import('./useMatches')

    const { result, rerender } = renderHook(() => useMatches(4, 't1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.loading).toBe(false))

    const primera = result.current.matches
    expect(primera).toHaveLength(2)

    rerender()
    rerender()

    expect(result.current.matches).toBe(primera)
  })
})
