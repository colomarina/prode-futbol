import type { Round } from '../types/domain'

/** Lo que hace falta de una fecha para poder nombrarla. */
type RondaConNombre = Pick<Round, 'name' | 'round_number'>

export function getFallbackRoundName(roundNumber: number | null | undefined): string {
  if (roundNumber === null || roundNumber === undefined) return 'Sin fecha'
  return `Fecha ${roundNumber}`
}

export function getRoundDisplayName(round: RondaConNombre | null | undefined): string {
  if (!round) return 'Sin fecha'

  const explicitName = typeof round.name === 'string' ? round.name.trim() : ''
  if (explicitName) return explicitName

  return getFallbackRoundName(round.round_number)
}

export function getRoundDisplayNameByNumber(
  roundNumber: number | null | undefined,
  rounds: RondaConNombre[] | null | undefined = []
): string {
  const existingRound = (rounds || []).find(round => round.round_number === roundNumber)
  if (existingRound) return getRoundDisplayName(existingRound)
  return getFallbackRoundName(roundNumber)
}
