import { getTournamentConfig } from '../../config/tournaments.config'
import type { Tournament } from '../../types/domain'
import styles from './TournamentCard.module.css'

const STATUS_LABELS: Record<string, string> = {
  upcoming: 'Próximamente',
  active: 'Activo',
  finished: 'Finalizado',
}

const STATUS_COLORS: Record<string, string> = {
  upcoming: 'var(--color-warning)',
  active: 'var(--color-success)',
  finished: 'var(--color-info)',
}

export default function TournamentCard({
  tournament,
  onClick,
  disabled = false,
}: {
  tournament: Tournament
  onClick: (tournament: Tournament) => void
  disabled?: boolean
}) {
  const isDisabled = Boolean(disabled)

  /**
   * El emoji sale de la config del torneo y no de la fila: `tournaments` **no tiene**
   * una columna `emoji`. Antes se leía `tournament.emoji`, que era siempre
   * `undefined`, así que todas las tarjetas mostraron la pelota genérica. Lo marcó
   * el tipado al migrar a TypeScript.
   *
   * La pelota queda como fallback para los torneos sin entrada en la config —los de
   * prueba, por ejemplo—, que es el mismo criterio que usa el resto de la app.
   */
  const emoji = getTournamentConfig(tournament.slug)?.emoji ?? '⚽'

  return (
    <button
      className={`${styles.card} ${isDisabled ? styles.cardDisabled : ''}`}
      onClick={() => onClick(tournament)}
      disabled={isDisabled}
      title={isDisabled ? 'Torneo no habilitado por el momento' : ''}
    >
      <div className={styles.emoji}>{emoji}</div>
      <h2 className={styles.name}>{tournament.name}</h2>
      <p className={styles.season}>{tournament.season}</p>
      <div
        className={styles.badge}
        style={{
          backgroundColor: STATUS_COLORS[tournament.status] || STATUS_COLORS.upcoming,
        }}
      >
        {STATUS_LABELS[tournament.status] || tournament.status}
      </div>
      {isDisabled && <p className={styles.disabledHint}>No disponible por el momento</p>}
    </button>
  )
}
