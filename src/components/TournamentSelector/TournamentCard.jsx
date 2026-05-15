import styles from './TournamentCard.module.css'

const STATUS_LABELS = {
  upcoming: 'Próximamente',
  active: 'Activo',
  finished: 'Finalizado',
}

const STATUS_COLORS = {
  upcoming: 'var(--color-warning)',
  active: 'var(--color-success)',
  finished: 'var(--color-info)',
}

export default function TournamentCard({ tournament, onClick, disabled = false }) {
  const isDisabled = Boolean(disabled)

  return (
    <button
      className={`${styles.card} ${isDisabled ? styles.cardDisabled : ''}`}
      onClick={() => onClick(tournament)}
      disabled={isDisabled}
      title={isDisabled ? 'Torneo no habilitado por el momento' : ''}
    >
      <div className={styles.emoji}>{tournament.emoji || '⚽'}</div>
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
