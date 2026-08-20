import type { Uuid } from '../types/domain'

/**
 * El contrato de las escrituras vive en `types/results.ts` porque no es exclusivo
 * de los hooks: los contexts (`AuthContext`) devuelven la misma forma. Se
 * re-exporta desde acá para que los hooks lo importen de un solo lugar.
 */
export type { MutationError, MutationResult, MutationResultWithData } from '../types/results'

/**
 * El payload del upsert batch de pronósticos.
 *
 * Lo produce `collectPredictionsToSave` (en `PredictionForm/savePredictions.ts`) y
 * lo consume `usePredictions.batchUpsertPredictions`. Vive acá, del lado de la capa
 * de datos, porque estaba **duplicado implícitamente** entre el productor y el
 * consumidor: cada uno describía la misma forma en su propio comentario y nada los
 * ataba.
 */
export interface PredictionUpsertInput {
  matchId: Uuid
  homePrediction: number
  awayPrediction: number
  qualifierPredictionId?: Uuid | null
}
