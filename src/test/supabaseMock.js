import { vi } from 'vitest'

/**
 * Mock del query builder de Supabase.
 *
 * El builder real es encadenable y "thenable": `supabase.from(t).select(s).eq(...)`
 * devuelve algo que se puede await-ear y resuelve `{ data, error }`. Este mock
 * replica esa forma para poder testear los hooks sin red.
 */
export const createQueryResult = (result, onFilter) => {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn((column, value) => {
      onFilter?.(column, value)
      return query
    }),
    in: vi.fn((column, value) => {
      onFilter?.(column, value)
      return query
    }),
    order: vi.fn(() => query),
    insert: vi.fn(() => query),
    update: vi.fn(() => query),
    delete: vi.fn(() => query),
    maybeSingle: vi.fn(() => query),
    single: vi.fn(() => query),
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
export const createSupabaseMock = (resultsByTable, rpcResults = {}) => {
  const callsByTable = {}
  /** @type {Array<{table: string, filters: Array<[string, unknown]>}>} */
  const queries = []

  const from = vi.fn(table => {
    callsByTable[table] = (callsByTable[table] || 0) + 1
    const record = { table, filters: [] }
    queries.push(record)

    return createQueryResult(resultsByTable[table] ?? { data: [], error: null }, (column, value) =>
      record.filters.push([column, value])
    )
  })

  const rpc = vi.fn(name => Promise.resolve(rpcResults[name] ?? { data: [], error: null }))

  return {
    supabase: { from, rpc },
    /** Cuántas veces se consultó una tabla. */
    callsTo: table => callsByTable[table] || 0,
    /** Todas las consultas hechas a una tabla, con los filtros que se aplicaron. */
    queriesTo: table => queries.filter(query => query.table === table),
    /** Si toda consulta a esa tabla filtró por la columna indicada. */
    everyQueryFilteredBy: (table, column) => {
      const tableQueries = queries.filter(query => query.table === table)
      if (tableQueries.length === 0) return false
      return tableQueries.every(query => query.filters.some(([name]) => name === column))
    },
  }
}
