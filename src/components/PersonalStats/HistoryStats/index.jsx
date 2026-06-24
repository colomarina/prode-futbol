import { getRoundDisplayNameByNumber } from '../../../utils/roundLabels'
import { StatCard } from '../StatCard'
import styles from './HistoryStats.module.css'

export const HistoryStats = ({ history }) => {
  return (
    <div className={styles.container}>
      <StatCard
        icon="🏆"
        title="Fechas Ganadas"
        value={history.roundsWon}
        iconBg="rgba(245, 158, 11, 0.12)"
        iconColor="var(--color-warning)"
      />
      <StatCard
        icon="🥉"
        title="Podios"
        value={history.podiums}
        subtext="Rondas en las que quedaste top 3"
        iconBg="rgba(168, 85, 247, 0.12)"
        iconColor="var(--color-secondary)"
      />
      <StatCard
        icon="🚀"
        title="Mejor Posición Alcanzada"
        value={history.bestPosition ? `${history.bestPosition}°` : '—'}
        iconBg="rgba(16, 185, 129, 0.12)"
        iconColor="var(--color-success)"
      >
        {history.bestPositionRound && (
          <p className={styles.subtitle}>
            En {getRoundDisplayNameByNumber(history.bestPositionRound)}
          </p>
        )}
      </StatCard>
      <StatCard
        icon="📈"
        title="Fechas en Ascenso"
        value={history.roundsImproved}
        subtext="Cantidad de rondas que mejoraste tu posición"
        iconBg="rgba(59, 130, 246, 0.12)"
        iconColor="var(--color-info)"
      />
    </div>
  )
}
