import { StatCard } from '../StatCard'
import styles from './StreakStats.module.css'

export const StreakStats = ({ streaks }) => {
  return (
    <div className={styles.container}>
      <div className={styles.cards}>
        <StatCard
          icon="🔥"
          title="Mejor Racha Sumando Puntos"
          value={streaks.longestPointStreak}
          iconBg="rgba(245, 158, 11, 0.12)"
          iconColor="var(--color-warning)"
        />
        <StatCard
          icon="🎯"
          title="Mayor Cantidad de Plenos"
          value={streaks.longestPlenoStreak}
          iconBg="rgba(16, 185, 129, 0.12)"
          iconColor="var(--color-success)"
        />
        <StatCard
          icon="🥉"
          title="Racha en Top 3"
          value={streaks.longestTop3Streak}
          iconBg="rgba(168, 85, 247, 0.12)"
          iconColor="var(--color-secondary)"
        />
        <StatCard
          icon="🔟"
          title="Racha en Top 10"
          value={streaks.longestTop10Streak}
          iconBg="rgba(59, 130, 246, 0.12)"
          iconColor="var(--color-info)"
        />
      </div>
    </div>
  )
}
