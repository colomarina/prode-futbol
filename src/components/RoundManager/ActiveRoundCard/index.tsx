import RoundProgress from '../RoundProgress'
import LoadingState from '../../Common/LoadingState'
import { getRoundDisplayName } from '../../../utils/roundLabels'
import type { Round } from '../../../types/domain'
import type { PlayerProgress } from '../../../hooks/useRoundProgress'
import styles from './ActiveRoundCard.module.css'

export default function ActiveRoundCard({
  round,
  players,
  matchLabels,
  loading,
  error,
}: {
  round: Round
  players: PlayerProgress[]
  matchLabels: Record<number, string>
  loading: boolean
  error: boolean
}) {
  return (
    <section className={styles.card} aria-label="Fecha en juego">
      <p className={styles.tag}>
        <span aria-hidden="true">🟢</span> Fecha en juego
      </p>
      <p className={styles.roundName}>{getRoundDisplayName(round)}</p>
      {loading ? (
        <LoadingState message="Cargando progreso..." size="sm" />
      ) : error ? (
        <p className={styles.notice}>No se pudo cargar el progreso</p>
      ) : players.length === 0 ? (
        <p className={styles.notice}>Todavía nadie pronosticó esta fecha</p>
      ) : (
        <RoundProgress players={players} matchLabels={matchLabels} />
      )}
    </section>
  )
}
