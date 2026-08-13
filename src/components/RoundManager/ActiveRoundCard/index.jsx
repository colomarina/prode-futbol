import RoundProgress from '../RoundProgress'
import { getRoundDisplayName } from '../../../utils/roundLabels'
import styles from './ActiveRoundCard.module.css'

/**
 * La tarjeta destacada de la fecha activa, con el progreso de los jugadores.
 *
 * "Activa" no quiere decir `status === 'open'`: se deriva del partido más próximo
 * que todavía no empezó (`utils/matchTiming.js`). `rounds.status` se actualiza a
 * mano y queda desincronizado, así que no sirve para esto.
 *
 * @param {{ round: object, players: Array<object> }} props
 */
export default function ActiveRoundCard({ round, players }) {
  return (
    <div className={styles.card}>
      <div className={styles.stripe} aria-hidden="true" />

      <div className={styles.body}>
        <div className={styles.tag}>
          <span aria-hidden="true">🟢</span>
          <span className={styles.tagText}>Fecha activa por partidas</span>
        </div>

        <div className={styles.round}>
          <div className={styles.roundIcon} aria-hidden="true">
            📅
          </div>
          <div>
            <p className={styles.roundName}>{getRoundDisplayName(round)}</p>
            <p className={styles.roundHint}>
              La fecha activa se calcula por el partido más próximo que todavía no empezó
            </p>
          </div>
        </div>

        {players.length > 0 && <RoundProgress players={players} />}
      </div>
    </div>
  )
}
