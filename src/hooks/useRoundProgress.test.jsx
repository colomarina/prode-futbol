import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createSupabaseMock } from '../test/supabaseMock'

const V2 = 'get_round_predictions_summary_by_tournament_v2'
const SCOPED = 'get_round_predictions_summary_by_tournament'
const SIN_SCOPE = 'get_round_predictions_summary'

const FILA = {
  user_id: 'u1',
  user_name: 'Lucas',
  total_matches: 8,
  predicted_count: 6,
  missing_matches: [3, 7],
  progress: '75.0',
  round_number: 4,
}

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

const nombresLlamados = () => mock.supabase.rpc.mock.calls.map(([name]) => name)

/** Importa el hook fresco después de configurar el mock. */
const cargarHook = async () => (await import('./useRoundProgress')).useRoundProgress

beforeEach(() => {
  vi.resetModules()
})

describe('useRoundProgress', () => {
  it('usa la RPC con scope de torneo y le pasa el torneo y la fecha', async () => {
    mock = createSupabaseMock({}, { [V2]: { data: [FILA], error: null } })
    const useRoundProgress = await cargarHook()

    const { result } = renderHook(() => useRoundProgress('t1', 4), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(nombresLlamados()).toEqual([V2])
    expect(mock.supabase.rpc.mock.calls[0][1]).toEqual({
      p_tournament_id: 't1',
      p_round_num: 4,
    })
  })

  it('mapea las filas al formato que usa el panel', async () => {
    mock = createSupabaseMock({}, { [V2]: { data: [FILA], error: null } })
    const useRoundProgress = await cargarHook()

    const { result } = renderHook(() => useRoundProgress('t1', 4), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.progress).toHaveLength(1))
    expect(result.current.progress[0]).toEqual({
      id: 'u1',
      name: 'Lucas',
      totalMatches: 8,
      predictedCount: 6,
      missingMatches: [3, 7],
      // Llega como texto de Postgres y se usa para comparar contra 100.
      progress: 75,
      roundNumber: 4,
    })
  })

  it('cae a la variante scopeada sin _v2 cuando la primera no existe', async () => {
    mock = createSupabaseMock(
      {},
      {
        [V2]: { data: null, error: { message: 'function does not exist' } },
        [SCOPED]: { data: [FILA], error: null },
      }
    )
    const useRoundProgress = await cargarHook()

    const { result } = renderHook(() => useRoundProgress('t1', 4), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.progress).toHaveLength(1))
    expect(nombresLlamados()).toEqual([V2, SCOPED])
  })

  it('nunca cae a la variante sin scope de torneo', async () => {
    // Es la regla del proyecto: los round_number se repiten entre torneos, así
    // que la variante sin scope devolvería el progreso de otro torneo.
    mock = createSupabaseMock(
      {},
      {
        [V2]: { data: null, error: { message: 'falla' } },
        [SCOPED]: { data: null, error: { message: 'falla' } },
        [SIN_SCOPE]: { data: [FILA], error: null },
      }
    )
    const useRoundProgress = await cargarHook()

    const { result } = renderHook(() => useRoundProgress('t1', 4), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.error).toBeTruthy())
    expect(nombresLlamados()).not.toContain(SIN_SCOPE)
    expect(result.current.progress).toEqual([])
  })

  it('una fecha sin jugadores corta la cadena en vez de reintentar', async () => {
    // Un [] es una respuesta válida. Si la cadena mirara la truthiness de `data`
    // en vez del error, seguiría probando la variante siguiente.
    mock = createSupabaseMock(
      {},
      { [V2]: { data: [], error: null }, [SCOPED]: { data: [FILA], error: null } }
    )
    const useRoundProgress = await cargarHook()

    const { result } = renderHook(() => useRoundProgress('t1', 4), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(nombresLlamados()).toEqual([V2])
    expect(result.current.progress).toEqual([])
  })

  it('descarta los jugadores ocultos', async () => {
    // Si un consumidor se saltea el filtro, los totales dejan de coincidir entre
    // pantallas.
    mock = createSupabaseMock(
      {},
      {
        [V2]: {
          data: [FILA, { ...FILA, user_id: 'u2', user_name: 'Leo Sanchez' }],
          error: null,
        },
      }
    )
    const useRoundProgress = await cargarHook()

    const { result } = renderHook(() => useRoundProgress('t1', 4), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.progress.map(p => p.name)).toEqual(['Lucas'])
  })

  it('sin fecha no consulta nada y no se queda cargando para siempre', async () => {
    mock = createSupabaseMock({}, {})
    const useRoundProgress = await cargarHook()

    const { result } = renderHook(() => useRoundProgress('t1', null), { wrapper: createWrapper() })

    expect(result.current.loading).toBe(false)
    expect(result.current.progress).toEqual([])
    expect(mock.supabase.rpc).not.toHaveBeenCalled()
  })

  it('devuelve la misma referencia entre renders', async () => {
    // Un array nuevo por render mete en bucle a cualquier efecto que lo use como
    // dependencia. Fue el bug de /admin/horarios.
    mock = createSupabaseMock({}, { [V2]: { data: [FILA], error: null } })
    const useRoundProgress = await cargarHook()

    const { result, rerender } = renderHook(() => useRoundProgress('t1', 4), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.progress).toHaveLength(1))
    const primera = result.current.progress
    rerender()
    expect(result.current.progress).toBe(primera)
  })
})
