import { getProgressLevel } from '../roundStatus'
import styles from './PlayerProgressRow.module.css'

const ICONS = { complete: '✅', partial: '⚠️', none: '❌' }

/**
 * Una fila del detalle de progreso: quién es el jugador, cuánto cargó y qué
 * partidos le faltan.
 *
 * @param {{
 *   player: {
 *     name: string,
 *     progress: number,
 *     predictedCount: number,
 *     totalMatches: number,
 *     missingMatches: number[],
 *   }
 * }} props
 */
export default function PlayerProgressRow({ player }) {
  const level = getProgressLevel(player.progress)
  const missing = player.missingMatches ?? []

  return (
    <div className={styles.row} data-progress={level}>
      <div className={styles.player}>
        <div className={styles.name}>
          <span className={styles.icon} aria-hidden="true">
            {ICONS[level]}
          </span>
          <span>{player.name}</span>
        </div>
        <div className={styles.count}>
          {player.predictedCount} de {player.totalMatches} partidos
        </div>
      </div>

      {missing.length > 0 ? (
        <div className={styles.missing}>
          <span className={styles.missingLabel}>Faltan partidos:</span>
          <div className={styles.missingList}>
            {missing.map(matchNumber => (
              <span key={matchNumber} className={styles.missingMatch}>
                #{matchNumber}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <span className={styles.complete}>Completo ✓</span>
      )}
    </div>
  )
}
