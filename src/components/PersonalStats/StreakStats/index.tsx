import StatCard from '../StatCard'
import type { Streaks } from '../../../utils/stats'
import styles from './StreakStats.module.css'

const StreakStats = ({ streaks }: { streaks: Streaks }) => {
  return (
    <div className={styles.container}>
      <div className={styles.cards}>
        <StatCard
          icon="🔥"
          title="Mejor Racha Sumando Puntos"
          value={streaks.longestPointStreak}
          iconColor="var(--color-warning)"
        />
        <StatCard
          icon="🎯"
          title="Mayor Cantidad de Plenos"
          value={streaks.longestPlenoStreak}
          iconColor="var(--color-success)"
        />
        <StatCard
          icon="🥉"
          title="Racha en Top 3"
          value={streaks.longestTop3Streak}
          iconColor="var(--color-secondary)"
        />
        <StatCard
          icon="🔟"
          title="Racha en Top 10"
          value={streaks.longestTop10Streak}
          iconColor="var(--color-info)"
        />
      </div>
    </div>
  )
}

export default StreakStats
