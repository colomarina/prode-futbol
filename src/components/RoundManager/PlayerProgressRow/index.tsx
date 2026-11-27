import { getProgressLevel } from '../progress'
import type { PlayerProgress } from '../../../hooks/useRoundProgress'
import type { ProgressLevel } from '../progress'
import styles from './PlayerProgressRow.module.css'

const ICONS: Record<ProgressLevel, string> = { complete: '✅', partial: '⚠️', none: '❌' }

export default function PlayerProgressRow({
  player,
  matchLabels,
}: {
  player: PlayerProgress
  matchLabels: Record<number, string>
}) {
  const level = getProgressLevel(player.progress)
  const missing = player.missingMatches ?? []

  return (
    <li className={styles.row} data-progress={level}>
      <div className={styles.header}>
        <span className={styles.name}>
          <span aria-hidden="true">{ICONS[level]}</span> <span>{player.name}</span>
        </span>
        <span className={styles.count}>
          {player.predictedCount} de {player.totalMatches}
        </span>
      </div>

      {missing.length > 0 ? (
        <ul className={styles.missingList} aria-label={`Le faltan a ${player.name}`}>
          {missing.map(matchNumber => (
            <li key={matchNumber} className={styles.missingMatch}>
              {matchLabels[matchNumber] ?? `#${matchNumber}`}
            </li>
          ))}
        </ul>
      ) : (
        <span className={styles.complete}>Completo</span>
      )}
    </li>
  )
}
