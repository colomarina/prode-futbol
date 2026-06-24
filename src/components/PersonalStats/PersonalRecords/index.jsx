import { getRoundDisplayNameByNumber } from '../../../utils/roundLabels'
import { StatCard } from '../StatCard'
import styles from './PersonalRecords.module.css'

const iconStyles = {
  'Mejor Fecha': { emoji: '🏅', bg: 'rgba(245, 158, 11, 0.12)', color: 'var(--color-warning)' },
  'Peor Fecha': { emoji: '⚠️', bg: 'rgba(239, 68, 68, 0.12)', color: 'var(--color-error)' },
  'Partido Más Acertado': {
    emoji: '🎯',
    bg: 'rgba(16, 185, 129, 0.12)',
    color: 'var(--color-success)',
  },
  'Fecha Más Precisa': {
    emoji: '📌',
    bg: 'rgba(14, 165, 233, 0.12)',
    color: 'var(--color-primary)',
  },
}

export const PersonalRecords = ({ records, rounds }) => {
  return (
    <div className={styles.container}>
      <StatCard
        icon={iconStyles['Mejor Fecha'].emoji}
        title="Mejor Fecha"
        value={getRoundDisplayNameByNumber(records.bestRound.roundNumber, rounds)}
        subtext={`${records.bestRound.points} puntos`}
        iconBg={iconStyles['Mejor Fecha'].bg}
        iconColor={iconStyles['Mejor Fecha'].color}
      />

      <StatCard
        icon={iconStyles['Peor Fecha'].emoji}
        title="Peor Fecha"
        value={getRoundDisplayNameByNumber(records.worstRound.roundNumber, rounds)}
        subtext={`${records.worstRound.points} puntos`}
        iconBg={iconStyles['Peor Fecha'].bg}
        iconColor={iconStyles['Peor Fecha'].color}
      />

      <StatCard
        icon={iconStyles['Partido Más Acertado'].emoji}
        title="Partido Más Acertado"
        iconBg={iconStyles['Partido Más Acertado'].bg}
        iconColor={iconStyles['Partido Más Acertado'].color}
      >
        {records.bestMatch ? (
          <>
            <p className={styles.matchLabel}>
              {records.bestMatch.match.home_team?.name} {records.bestMatch.match.home_score}-
              {records.bestMatch.match.away_score} {records.bestMatch.match.away_team?.name}
            </p>
            <p className={styles.subtitle}>
              Pronóstico: {records.bestMatch.prediction.home_prediction}-
              {records.bestMatch.prediction.away_prediction}
            </p>
            <p className={styles.subtitle}>Puntos: {records.bestMatch.points}</p>
          </>
        ) : (
          <p className={styles.empty}>No hay datos suficientes</p>
        )}
      </StatCard>

      <StatCard
        icon={iconStyles['Fecha Más Precisa'].emoji}
        title="Fecha Más Precisa"
        value={
          records.mostPreciseRound
            ? getRoundDisplayNameByNumber(records.mostPreciseRound.roundNumber, rounds)
            : '—'
        }
        subtext={
          records.mostPreciseRound ? `${records.mostPreciseRound.percentage}% de aciertos` : ''
        }
        iconBg={iconStyles['Fecha Más Precisa'].bg}
        iconColor={iconStyles['Fecha Más Precisa'].color}
      />
    </div>
  )
}
