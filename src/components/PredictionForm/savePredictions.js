/**
 * Qué se guarda y qué se le dice al usuario cuando aprieta "Guardar Todos".
 *
 * Estaba todo dentro de `handleSaveAll`, que eran ~85 líneas donde el comentario
 * que explicaba la regla de los vencidos era más largo que el código y no había
 * forma de testear ni el armado del payload ni los tres mensajes sin montar el
 * formulario entero.
 *
 * Los valores del formulario son siempre strings (`MatchPrediction` guarda lo
 * tipeado y siembra lo ya guardado con `.toString()`), así que un `''` es "no
 * cargado" y un `'0'` es un cero válido. De ahí el chequeo por truthiness y no
 * por `!= null`.
 */
import { canPredictMatch } from '../../utils/matchTiming'

/** Un pronóstico está completo cuando tiene los dos goles. */
const isComplete = values => Boolean(values?.home && values?.away)

/**
 * Los pronósticos que se van a mandar: completos y de partidos todavía abiertos.
 *
 * El filtro por `canPredictMatch` se evalúa acá y no al renderizar, porque entre
 * que la tarjeta se pintó y el usuario apretó Guardar puede haber vencido el
 * plazo. No hay contador en vivo: el input sigue habilitado hasta que algo
 * dispare un re-render.
 *
 * @returns {Array<{ matchId, homePrediction: number, awayPrediction: number, qualifierPredictionId: string|null }>}
 */
export const collectPredictionsToSave = ({ matches, predictionValues }) =>
  matches
    .filter(match => canPredictMatch(match.match_date) && isComplete(predictionValues[match.id]))
    .map(match => {
      const values = predictionValues[match.id]

      return {
        matchId: match.id,
        homePrediction: parseInt(values.home, 10),
        awayPrediction: parseInt(values.away, 10),
        qualifierPredictionId: values.qualifier || null,
      }
    })

/**
 * Los partidos donde el usuario cambió algo y el plazo venció antes de que
 * apretara Guardar.
 *
 * `collectPredictionsToSave` los descarta, y antes eso pasaba en silencio: si era
 * el único que había cargado, apretar Guardar no hacía nada —ni un toast— y
 * quedaba creyendo que se guardó.
 *
 * Se compara contra el pronóstico ya guardado y no alcanza con "tiene valores":
 * `MatchPrediction` siembra `predictionValues` con lo que ya estaba guardado (su
 * efecto de "inicializar valores desde predicción existente"), así que mirar solo
 * si hay valores contaba partidos que el usuario nunca tocó, incluido alguno ya
 * jugado y con resultado cargado.
 */
export const findExpiredPredictions = ({ matches, predictionValues, predictionsByMatchId }) =>
  matches.filter(match => {
    if (canPredictMatch(match.match_date)) return false

    const values = predictionValues[match.id]
    if (!isComplete(values)) return false

    const guardado = predictionsByMatchId.get(match.id)
    if (!guardado) return true

    return (
      String(guardado.home_prediction) !== String(values.home) ||
      String(guardado.away_prediction) !== String(values.away)
    )
  })

/**
 * El toast del guardado: los cinco resultados posibles en un solo lugar.
 *
 * Los vencidos cambian el tono a `warning` incluso cuando el guardado salió bien,
 * porque algo que el usuario cargó no entró y tiene que saberlo.
 *
 * @param {{ savedCount: number, expiredCount: number, error?: unknown }} params
 * @returns {{ message: string, type: 'success'|'warning'|'error' }}
 */
export const getSaveToast = ({ savedCount, expiredCount, error }) => {
  if (error) {
    return { message: 'Error al guardar pronósticos. Intentá de nuevo.', type: 'error' }
  }

  if (savedCount === 0) {
    if (expiredCount === 0) {
      return { message: 'No hay pronósticos para guardar', type: 'warning' }
    }

    const detalle =
      expiredCount === 1
        ? 'ese pronóstico no se guardó'
        : `esos ${expiredCount} pronósticos no se guardaron`

    return { message: `El plazo venció mientras cargabas: ${detalle}.`, type: 'warning' }
  }

  const plural = savedCount > 1 ? 's' : ''
  const guardados = `${savedCount} pronóstico${plural} guardado${plural} correctamente`

  if (expiredCount === 0) {
    return { message: guardados, type: 'success' }
  }

  const afuera = expiredCount === 1 ? 'Otro quedó' : `Otros ${expiredCount} quedaron`

  return {
    message: `${guardados}. ${afuera} afuera porque venció el plazo.`,
    type: 'warning',
  }
}
