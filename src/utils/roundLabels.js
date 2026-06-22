export function getFallbackRoundName(roundNumber) {
  if (roundNumber === null || roundNumber === undefined) return 'Sin fecha'
  return `Fecha ${roundNumber}`
}

export function getRoundDisplayName(round) {
  if (!round) return 'Sin fecha'

  const explicitName = typeof round.name === 'string' ? round.name.trim() : ''
  if (explicitName) return explicitName

  return getFallbackRoundName(round.round_number)
}

export function getRoundDisplayNameByNumber(roundNumber, rounds = []) {
  const existingRound = (rounds || []).find(round => round.round_number === roundNumber)
  if (existingRound) return getRoundDisplayName(existingRound)
  return getFallbackRoundName(roundNumber)
}
