import StatCard from '../StatCard'
import type { TournamentStats } from '../../../utils/stats'
import styles from './PerformanceOverview.module.css'

const PerformanceOverview = ({ metrics }: { metrics: TournamentStats['metrics'] }) => {
  return (
    <div className={styles.container}>
      <div className={styles.cards}>
        <StatCard icon="🏆" title="Total de Puntos" value={metrics.totalPoints} />
        <StatCard
          icon="🥇"
          title="Posición actual en la general"
          value={metrics.currentPosition ? `${metrics.currentPosition}°` : '—'}
          subtext={`de ${metrics.totalParticipants} participantes`}
          iconColor="var(--color-secondary)"
        />
        <StatCard
          icon="📈"
          title="Promedio por Fecha"
          value={metrics.avgPerRound.toFixed(1)}
          iconColor="var(--color-info)"
        />
        <StatCard
          icon="🎯"
          title="Precisión General"
          value={metrics.hitPercentage}
          unit="%"
          iconColor="var(--color-success)"
        />
      </div>
    </div>
  )
}

export default PerformanceOverview
