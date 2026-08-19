import type { PostgrestError } from '@supabase/supabase-js'

/**
 * Lo que puede llegar en el `error` de una escritura: el de PostgREST, el de Auth
 * (que extiende `Error`), o uno propio que el hook arma (`openNextRound` tira un
 * `Error` cuando no hay fecha pendiente).
 *
 * Los tres tienen `message`, que es lo único que leen los componentes para armar el
 * toast. Tipar esto como `unknown` sería más correcto en abstracto y peor en la
 * práctica: obligaría a estrechar en cada consumidor para leer un campo que siempre
 * está.
 */
export type MutationError = PostgrestError | Error

/**
 * El contrato que ya consumen los componentes: las escrituras **no** propagan la
 * excepción, devuelven `{ error }` y cada pantalla decide qué mostrar. Se conserva
 * tal cual para no tocar a los consumidores mientras migran.
 */
export interface MutationResult {
  error: MutationError | null
}

/** Igual que `MutationResult`, para las escrituras que además devuelven la fila. */
export interface MutationResultWithData<T> extends MutationResult {
  data: T | null
}
