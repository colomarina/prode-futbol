import type { PlayerProgress } from '../../hooks/useRoundProgress'
import type { MatchWithTeams } from '../../types/domain'

/** Los tres niveles de progreso que muestra el panel. */
export type ProgressLevel = 'complete' | 'partial' | 'none'

export const getProgressLevel = (progress: number): ProgressLevel => {
  if (progress === 100) return 'complete'
  if (progress > 0) return 'partial'
  return 'none'
}

/** Cuántos jugadores hay en cada nivel. Alimenta las tres tarjetas del resumen. */
export const countByProgressLevel = (players: PlayerProgress[]): Record<ProgressLevel, number> => {
  const counts = { complete: 0, partial: 0, none: 0 }
  players.forEach(player => {
    counts[getProgressLevel(player.progress)] += 1
  })
  return counts
}

export const buildMatchLabels = (
  matches: Pick<MatchWithTeams, 'match_number' | 'home_team' | 'away_team'>[]
): Record<number, string> => {
  const labels: Record<number, string> = {}
  matches.forEach(match => {
    labels[match.match_number] =
      `${match.home_team?.name ?? '?'} vs ${match.away_team?.name ?? '?'}`
  })
  return labels
}
