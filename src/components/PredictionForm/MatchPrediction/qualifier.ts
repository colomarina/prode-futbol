/**
 * Reglas del clasificado por penales en un partido de playoff.
 *
 * Es la lógica más enredada del formulario de pronósticos y estaba repartida en
 * cuatro `useMemo`, dos `useEffect` y seis expresiones sueltas dentro de un
 * componente de 614 líneas, cada una con su propia cadena de `||`. Acá es una
 * función pura con todo junto, y por lo tanto testeable.
 *
 * Las tres decisiones que toma:
 *
 *   1. **Si se muestra el selector.** Solo cuando el marcador pronosticado es un
 *      empate: con un ganador en los 90 minutos no hay penales que pronosticar.
 *   2. **Si está bloqueado.** Si el marcador define un ganador, el clasificado es
 *      ese y no se puede elegir otro.
 *   3. **Quién está elegido.** Con distinta prioridad según se pueda editar o no,
 *      y ahí está el detalle fino: editando manda el ganador automático y después
 *      lo que el usuario tocó; mirando manda lo que quedó guardado.
 */
import { parseScoreValue, getWinnerTeamId } from '../../../utils/score'
import type { MatchWithTeams, Prediction, Uuid } from '../../../types/domain'
import type { MatchPredictionValues } from '../savePredictions'

/** Lo que se necesita del partido para resolver el clasificado. */
type PartidoDePlayoff = Pick<
  MatchWithTeams,
  'is_playoff' | 'home_team_id' | 'away_team_id' | 'home_team' | 'away_team'
>

/** El pronóstico ya guardado, si hay. */
type PronosticoGuardado = Pick<
  Prediction,
  'home_prediction' | 'away_prediction' | 'qualifier_prediction_id'
>

/** Las tres decisiones que toma `resolveQualifier`. */
export interface QualifierResolution {
  homeScoreNumber: number | null
  awayScoreNumber: number | null
  autoWinnerTeamId: Uuid | null
  isLocked: boolean
  shouldShowPicker: boolean
  selectedTeamId: Uuid | null
}

export const resolveQualifier = ({
  match,
  existingPrediction,
  predictionValue,
  canPredict,
}: {
  match: PartidoDePlayoff
  existingPrediction?: PronosticoGuardado | null
  predictionValue?: MatchPredictionValues
  canPredict?: boolean
}): QualifierResolution => {
  // Editando se lee lo que el usuario tiene tipeado; si ya no se puede editar, lo
  // que quedó guardado. Sin esta distinción, un partido cerrado mostraba el
  // selector según un marcador vacío.
  const homeValue = canPredict
    ? predictionValue?.home || ''
    : existingPrediction?.home_prediction?.toString() || ''
  const awayValue = canPredict
    ? predictionValue?.away || ''
    : existingPrediction?.away_prediction?.toString() || ''

  const homeScoreNumber = parseScoreValue(homeValue)
  const awayScoreNumber = parseScoreValue(awayValue)
  const autoWinnerTeamId = getWinnerTeamId(homeScoreNumber, awayScoreNumber, match)

  const isTie =
    homeScoreNumber !== null && awayScoreNumber !== null && homeScoreNumber === awayScoreNumber

  const selectedTeamId = !match.is_playoff
    ? null
    : canPredict
      ? autoWinnerTeamId ||
        predictionValue?.qualifier ||
        existingPrediction?.qualifier_prediction_id ||
        match.home_team_id
      : existingPrediction?.qualifier_prediction_id ||
        autoWinnerTeamId ||
        match.home_team_id ||
        null

  return {
    homeScoreNumber,
    awayScoreNumber,
    autoWinnerTeamId,
    isLocked: Boolean(autoWinnerTeamId),
    shouldShowPicker: Boolean(match.is_playoff) && isTie,
    selectedTeamId,
  }
}

/**
 * Qué valor de clasificado hay que escribir en el formulario, o `null` si no hay
 * que tocar nada.
 *
 * Reemplaza al `useEffect` que sincronizaba el clasificado: tenía dos ramas y
 * ocho dependencias, y la condición de "no hay que hacer nada" era implícita
 * (caerse por el final sin llamar a `onValueChange`). Acá es explícita y se puede
 * testear sin renderizar.
 */
export const getQualifierToSync = ({
  match,
  existingPrediction,
  predictionValue,
  canPredict,
}: {
  match: PartidoDePlayoff
  existingPrediction?: PronosticoGuardado | null
  predictionValue?: MatchPredictionValues
  canPredict?: boolean
}): Uuid | null => {
  if (!match.is_playoff || !canPredict) return null

  const { autoWinnerTeamId } = resolveQualifier({
    match,
    existingPrediction,
    predictionValue,
    canPredict,
  })

  // Con ganador en los 90, el clasificado lo define el marcador.
  if (autoWinnerTeamId) {
    return predictionValue?.qualifier === autoWinnerTeamId ? null : autoWinnerTeamId
  }

  // Empate sin nada elegido: se propone el guardado, y si no hay, el local.
  if (!predictionValue?.qualifier) {
    return existingPrediction?.qualifier_prediction_id || match.home_team_id
  }

  return null
}
