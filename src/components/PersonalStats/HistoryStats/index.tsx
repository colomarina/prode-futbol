import { getRoundDisplayNameByNumber } from '../../../utils/roundLabels'
import StatCard from '../StatCard'
import type { StatsHistory } from '../../../utils/stats'
import styles from './HistoryStats.module.css'

const HistoryStats = ({ history }: { history: StatsHistory }) => {
  return (
    <div className={styles.container}>
      <StatCard
        icon="🏆"
        title="Fechas Ganadas"
        value={history.roundsWon}
        iconColor="var(--color-warning)"
      />
      <StatCard
        icon="🥉"
        title="Podios"
        value={history.podiums}
        subtext="Rondas en las que quedaste top 3"
        iconColor="var(--color-secondary)"
      />
      <StatCard
        icon="🚀"
        title="Mejor Posición Alcanzada"
        value={history.bestPosition ? `${history.bestPosition}°` : '—'}
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
        iconColor="var(--color-info)"
      />
    </div>
  )
}

export default HistoryStats
