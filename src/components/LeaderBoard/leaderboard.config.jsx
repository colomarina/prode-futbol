/**
 * El podio. Estos tres colores se dejan literales a propósito: oro, plata y
 * bronce son lo que la medalla significa, así que no tienen que seguir la paleta
 * del torneo. Están acá, con nombre, y no repartidos por los componentes.
 */
export const POSITION_CONFIG = {
  1: { emoji: '🥇', bgColor: 'rgba(249, 168, 37, 0.1)' },
  2: { emoji: '🥈', bgColor: 'rgba(189, 189, 189, 0.1)' },
  3: { emoji: '🥉', bgColor: 'rgba(205, 127, 50, 0.1)' },
}

export const TABLE_COLUMNS = {
  general: ['Pos', 'Jugador', 'Pts', 'Fch'],
  round: ['Pos', 'Jugador', 'Pts', ''],
  playoffs: ['Pos', 'Jugador', 'Pts'],
}
