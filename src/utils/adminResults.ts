import { canLoadResult } from './matchTiming'
import type { Match, MatchMeta } from '../types/domain'

export const getPendingResultsRoundNumber = (
  matchesMeta: MatchMeta[],
  now: Date = new Date()
): number | null => {
  const loadable = matchesMeta.filter(match => canLoadResult(match.match_date, now))
  const pending = loadable.filter(match => !match.is_finished).map(match => match.round_number)
  if (pending.length > 0) return Math.min(...pending)
  if (loadable.length > 0) return Math.max(...loadable.map(match => match.round_number))
  return null
}

export const splitByResult = <T extends Pick<Match, 'is_finished'>>(
  matches: T[]
): { pending: T[]; loaded: T[] } => ({
  pending: matches.filter(match => !match.is_finished),
  loaded: matches.filter(match => match.is_finished),
})
