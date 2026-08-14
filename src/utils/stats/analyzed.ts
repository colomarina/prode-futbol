/**
 * Prepara la entrada de todos los cálculos de estadísticas: cruza los partidos
 * del torneo con los pronósticos del usuario y deja solo los pares analizables.
 *
 * Un pronóstico es analizable cuando su partido ya terminó (`is_finished`) y el
 * usuario efectivamente lo pronosticó. Los partidos sin pronóstico no son un
 * error del 0%: no entran en ninguna cuenta.
 *
 * **El orden importa y es por fecha de partido, no por número de fecha.** Las
 * rachas (`streaks.ts`) recorren este array en orden y cuentan aciertos
 * consecutivos, así que ordenar por `round_number` daría rachas distintas
 * cuando una fecha se juega desfasada — y en el Mundial los partidos de una
 * misma ronda se reparten en varios días.
 */
import type { MatchWithTeams, Prediction } from '../../types/domain'
import type { AnalyzedPrediction } from './types'

export const collectAnalyzedPredictions = (
  matches: MatchWithTeams[] | null | undefined,
  predictions: Prediction[] | null | undefined
): { analyzedPredictions: AnalyzedPrediction[]; finishedMatches: MatchWithTeams[] } => {
  const predictionsByMatchId = new Map((predictions || []).map(pred => [pred.match_id, pred]))

  const finishedMatches = (matches || []).filter(match => match.is_finished)

  const analyzedPredictions = [...finishedMatches]
    .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())
    .map(match => ({ match, prediction: predictionsByMatchId.get(match.id) }))
    .filter((entry): entry is AnalyzedPrediction => Boolean(entry.prediction))

  return { analyzedPredictions, finishedMatches }
}
