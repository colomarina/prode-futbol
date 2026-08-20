import StatCard from '../StatCard'
import type { TeamStats as TeamStatsData } from '../../../utils/stats'
import styles from './TeamStats.module.css'

/**
 * Las tres tarjetas de equipos.
 *
 * Dos cosas que quedaron a la vista al tipar esto y que **no se cambiaron**, porque
 * son decisiones de UI y no de tipos:
 *
 * 1. `fallback` solo está en la primera. Las otras dos, cuando no hay datos,
 *    renderizan un párrafo vacío en vez de "No hay datos suficientes".
 * 2. `valueLabel` y `valueText` del primer item **no los usa nadie**: el JSX de
 *    abajo llama a `formatValue` y a `fallback`, nada más. Se dejaron para no
 *    mezclar limpieza con migración.
 */
/**
 * Las dos formas que puede tener el valor de una tarjeta: el equipo favorito trae
 * `count` (cuántas veces se lo eligió) y los leídos traen `percentage`.
 *
 * Va con los dos campos opcionales y no como unión de `FavoriteTeam | TeamRead`
 * porque los `formatValue` de abajo **preguntan por los dos** para decidir qué
 * mostrar. Con la unión, cada rama del ternario es un error de tipos aunque el
 * código sea correcto.
 */
interface TeamStatValue {
  name: string
  count?: number
  percentage?: number
  matches?: number
}

interface TeamStatItem {
  title: string
  icon: string
  iconColor: string
  teamKey: keyof TeamStatsData
  formatValue: (team: TeamStatValue) => string
  fallback?: string
  valueLabel?: (team: TeamStatValue) => string | undefined
  valueText?: (team: TeamStatValue) => string
}

const items: TeamStatItem[] = [
  {
    title: 'Equipo Favorito',
    icon: '⭐',
    iconColor: 'var(--color-warning)',
    valueLabel: team => team?.name,
    valueText: team => (team ? `${team.count ?? ''}` : ''),
    fallback: 'No hay datos suficientes',
    formatValue: team =>
      team?.count !== undefined ? `${team.count} veces` : `${team?.percentage}% de acierto`,
    teamKey: 'favoriteTeam',
  },
  {
    title: 'Equipo Mejor Leído',
    icon: '🎯',
    iconColor: 'var(--color-success)',
    formatValue: team =>
      team?.count !== undefined ? `${team.count} veces` : `${team?.percentage}% de acierto`,
    teamKey: 'bestReadTeam',
  },
  {
    title: 'Equipo Peor Leído',
    icon: '📉',
    iconColor: 'var(--color-error)',
    formatValue: team =>
      team?.count !== undefined ? `${team.count} veces` : `${team?.percentage}% de acierto`,
    teamKey: 'worstReadTeam',
  },
]

const TeamStats = ({ teamStats }: { teamStats: TeamStatsData }) => {
  return (
    <div className={styles.container}>
      <div className={styles.cards}>
        {items.map(item => {
          const team = teamStats[item.teamKey]
          return (
            <StatCard
              key={item.title}
              icon={item.icon}
              iconColor={item.iconColor}
              title={item.title}
            >
              {team ? (
                <>
                  <p className={styles.name}>{team.name}</p>
                  <p className={styles.value}>{item.formatValue(team)}</p>
                </>
              ) : (
                <p className={styles.empty}>{item.fallback}</p>
              )}
            </StatCard>
          )
        })}
      </div>
    </div>
  )
}

export default TeamStats
