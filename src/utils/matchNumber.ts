import type { Match } from '../types/domain'

export const showsMatchNumber = (
  match: Pick<Match, 'is_playoff'> & { match_number: number | null }
): boolean => !match.is_playoff && Boolean(match.match_number)
