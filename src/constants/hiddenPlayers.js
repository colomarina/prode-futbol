const HIDDEN_PLAYER_TOKEN_GROUPS = [
  ['ezequiel', 'cordoba'],
  ['geronimo', 'garcia'],
  ['leo', 'sanchez'],
  ['pablo', 'adrian'],
  ['jose', 'miner'],
]

const normalizeText = value =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

export const isHiddenPlayerName = name => {
  const normalizedName = normalizeText(name)

  if (!normalizedName) return false

  return HIDDEN_PLAYER_TOKEN_GROUPS.some(tokenGroup =>
    tokenGroup.every(token => normalizedName.includes(token))
  )
}

export const isHiddenPlayer = player =>
  isHiddenPlayerName(player?.full_name) ||
  isHiddenPlayerName(player?.fullName) ||
  isHiddenPlayerName(player?.name) ||
  isHiddenPlayerName(player?.username)

export const filterHiddenPlayers = list => (list || []).filter(player => !isHiddenPlayer(player))
