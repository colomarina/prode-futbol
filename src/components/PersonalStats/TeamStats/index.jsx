import { StatCard } from '../StatCard'
import styles from './TeamStats.module.css'

const items = [
  {
    title: 'Equipo Favorito',
    icon: '⭐',
    iconBg: 'rgba(245, 158, 11, 0.12)',
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
    iconBg: 'rgba(16, 185, 129, 0.12)',
    iconColor: 'var(--color-success)',
    formatValue: team =>
      team?.count !== undefined ? `${team.count} veces` : `${team?.percentage}% de acierto`,
    teamKey: 'bestReadTeam',
  },
  {
    title: 'Equipo Peor Leído',
    icon: '📉',
    iconBg: 'rgba(239, 68, 68, 0.12)',
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
              iconBg={item.iconBg}
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
