import { StatCard } from '../StatCard'
import styles from './PerformanceOverview.module.css'

export const PerformanceOverview = ({ metrics }) => {
  return (
    <div className={styles.container}>
      <div className={styles.cards}>
        <StatCard icon="🏆" title="Total de Puntos" value={metrics.totalPoints} />
        <StatCard
          icon="🥇"
          title="Posición actual en la general"
          value={metrics.currentPosition ? `${metrics.currentPosition}°` : '—'}
          subtext={`de ${metrics.totalParticipants} participantes`}
          iconBg="rgba(244, 114, 182, 0.12)"
          iconColor="var(--color-secondary)"
        />
        <StatCard
          icon="📈"
          title="Promedio por Fecha"
          value={metrics.avgPerRound.toFixed(1)}
          iconBg="rgba(59, 130, 246, 0.12)"
          iconColor="var(--color-info)"
        />
        <StatCard
          icon="🎯"
          title="Precisión General"
          value={metrics.hitPercentage}
          unit="%"
          iconBg="rgba(16, 185, 129, 0.12)"
          iconColor="var(--color-success)"
        />
      </div>
    </div>
  )
}
