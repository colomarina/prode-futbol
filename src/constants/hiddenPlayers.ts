const HIDDEN_PLAYER_TOKEN_GROUPS = [
  ['ezequiel', 'cordoba'],
  ['geronimo', 'garcia'],
  ['leo', 'sanchez'],
  ['pablo', 'adrian'],
  ['jose', 'miner'],
]

/**
 * Cualquiera de las formas en que un jugador trae su nombre.
 *
 * Son cuatro campos porque las cuatro pantallas que filtran traen formas distintas:
 * el perfil de la base usa `full_name` y `username`, el progreso de la fecha arma
 * un `name`, y algún componente viejo usa `fullName`.
 */
export interface JugadorConNombre {
  full_name?: string | null
  fullName?: string | null
  name?: string | null
  username?: string | null
}

const normalizeText = (value: unknown): string =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

export const isHiddenPlayerName = (name: unknown): boolean => {
  const normalizedName = normalizeText(name)

  if (!normalizedName) return false

  return HIDDEN_PLAYER_TOKEN_GROUPS.some(tokenGroup =>
    tokenGroup.every(token => normalizedName.includes(token))
  )
}

export const isHiddenPlayer = (player: JugadorConNombre | null | undefined): boolean =>
  isHiddenPlayerName(player?.full_name) ||
  isHiddenPlayerName(player?.fullName) ||
  isHiddenPlayerName(player?.name) ||
  isHiddenPlayerName(player?.username)

/**
 * Genérico para devolver el mismo tipo que recibió: antes venía de un `.js`, así
 * que devolvía `any[]` y **las anotaciones de los hooks que lo usan no verificaban
 * nada**. Con esto, cada consumidor conserva su tipo.
 */
export const filterHiddenPlayers = <T extends JugadorConNombre>(
  list: T[] | null | undefined
): T[] => (list || []).filter(player => !isHiddenPlayer(player))
