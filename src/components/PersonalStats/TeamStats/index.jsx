import { StatCard } from '../StatCard'
import styles from './TeamStats.module.css'

const items = [
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

export const TeamStats = ({ teamStats }) => {
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
