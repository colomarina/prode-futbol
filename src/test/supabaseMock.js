import { vi } from 'vitest'

/**
 * Mock del query builder de Supabase.
 *
 * El builder real es encadenable y "thenable": `supabase.from(t).select(s).eq(...)`
 * devuelve algo que se puede await-ear y resuelve `{ data, error }`. Este mock
 * replica esa forma para poder testear los hooks sin red.
 */
export const createQueryResult = result => {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    in: vi.fn(() => query),
    order: vi.fn(() => query),
    insert: vi.fn(() => query),
    update: vi.fn(() => query),
    delete: vi.fn(() => query),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  }

  return query
}

/**
 * Arma un mock de `supabase` que devuelve datos distintos por tabla y cuenta
 * cuántas veces se consultó cada una.
 *
 * @param {Record<string, {data?: any, error?: any}>} resultsByTable
 */
export const createSupabaseMock = resultsByTable => {
  const callsByTable = {}

  const from = vi.fn(table => {
    callsByTable[table] = (callsByTable[table] || 0) + 1
    return createQueryResult(resultsByTable[table] ?? { data: [], error: null })
  })

  return {
    supabase: { from, rpc: vi.fn() },
    /** Cuántas veces se consultó una tabla. */
    callsTo: table => callsByTable[table] || 0,
    reset: () => {
      Object.keys(callsByTable).forEach(key => delete callsByTable[key])
      from.mockClear()
    },
  }
}
