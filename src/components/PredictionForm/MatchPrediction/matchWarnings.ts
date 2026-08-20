/**
 * Qué mensaje y qué estado mostrar en la tarjeta de un partido, según el reloj.
 *
 * Todo el cálculo de tiempos sale de `utils/matchTiming.ts`, que es la fuente
 * única: acá no se resta ni un minuto a mano. Antes eran seis expresiones
 * booleanas sueltas al principio del componente, con las condiciones repetidas
 * entre ellas y sin forma de testearlas sin renderizar la tarjeta.
 */
import { canLoadResult, canPredictMatch, hasMatchStarted } from '../../../utils/matchTiming'
import type { IsoDate } from '../../../types/domain'

/** Los dos avisos que puede llevar una tarjeta sin pronóstico. */
export type MatchWarning = 'missed' | 'locked'

/** Lo que se muestra en la esquina de la tarjeta. */
export type MatchStatus = 'finished' | 'playing'

/**
 * El aviso para un partido que ya empezó y quedó sin pronóstico.
 *
 * Son dos situaciones distintas y conviene que el usuario las distinga:
 *
 *   - `missed`: ya pasó la ventana para cargar el resultado, o sea el partido
 *     terminó hace rato. No hay nada que hacer.
 *   - `locked`: el partido está en curso. Tampoco se puede cargar, pero el
 *     mensaje explica que fue el cierre y no un olvido de hace semanas.
 *
 * Un partido finalizado no lleva aviso: lleva el resultado y los puntos. Uno con
 * pronóstico cargado tampoco, no hay nada que avisar.
 *
 */
export const getMatchWarning = ({
  matchDate,
  isFinished,
  hasPrediction,
}: {
  matchDate: IsoDate
  isFinished?: boolean | null
  hasPrediction?: boolean
}): MatchWarning | null => {
  if (isFinished || hasPrediction) return null
  if (!hasMatchStarted(matchDate)) return null

  return canLoadResult(matchDate) ? 'missed' : 'locked'
}

/**
 * El estado que se muestra en la esquina de la tarjeta.
 *
 * `playing` aparece cuando el partido arrancó pero ya no se puede pronosticar.
 * El orden importa: `finished` gana siempre, porque un partido terminado no está
 * "en juego" aunque su horario haya pasado.
 *
 * En modo consulta (torneo cerrado) no se puede pronosticar nada, así que un
 * partido que arrancó y no terminó se muestra en juego igual — que es
 * exactamente lo que es.
 *
 */
export const getMatchStatus = ({
  matchDate,
  isFinished,
  isReadOnly = false,
}: {
  matchDate: IsoDate
  isFinished?: boolean | null
  isReadOnly?: boolean
}): MatchStatus | null => {
  if (isFinished) return 'finished'

  const canPredict = !isReadOnly && canPredictMatch(matchDate)

  return hasMatchStarted(matchDate) && !canPredict ? 'playing' : null
}
