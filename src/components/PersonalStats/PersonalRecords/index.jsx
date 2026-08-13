import { getRoundDisplayNameByNumber } from '../../../utils/roundLabels'
import { StatCard } from '../StatCard'
import styles from './PersonalRecords.module.css'

const iconStyles = {
  'Mejor Fecha': { emoji: '🏅', color: 'var(--color-warning)' },
  'Peor Fecha': { emoji: '⚠️', color: 'var(--color-error)' },
  'Partido Más Acertado': {
    emoji: '🎯',
    color: 'var(--color-success)',
  },
  'Fecha Más Precisa': {
    emoji: '📌',
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
        iconColor={iconStyles['Mejor Fecha'].color}
      />

      <StatCard
        icon={iconStyles['Peor Fecha'].emoji}
        title="Peor Fecha"
        value={getRoundDisplayNameByNumber(records.worstRound.roundNumber, rounds)}
        subtext={`${records.worstRound.points} puntos`}
        iconColor={iconStyles['Peor Fecha'].color}
      />

      <StatCard
        icon={iconStyles['Partido Más Acertado'].emoji}
        title="Partido Más Acertado"
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
        iconColor={iconStyles['Fecha Más Precisa'].color}
      />
    </div>
  )
}
