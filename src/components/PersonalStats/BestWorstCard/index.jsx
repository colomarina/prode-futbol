import { getRoundDisplayNameByNumber } from '../../../utils/roundLabels'
import styles from './BestWorstCard.module.css'

export const BestWorstCard = ({ type = 'best', roundNumber, rounds = [], roundLabel, points }) => {
  const isBest = type === 'best'
  const icon = isBest ? '🏆' : '😢'
  const label = isBest ? 'Mejor Fecha' : 'Peor Fecha'
  const displayRound = roundLabel ?? getRoundDisplayNameByNumber(roundNumber, rounds)
  return (
    <div className={`${styles.card} ${styles[type]}`}>
      <div className={styles.icon}>{icon}</div>
      <div className={styles.content}>
        <p className={styles.label}>{label}</p>
        <p className={styles.roundNumber}>{displayRound}</p>
        <p className={styles.points}>{points} puntos</p>
      </div>
    </div>
  )
}
