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

  return (
    <button
      className={`${styles.card} ${isDisabled ? styles.cardDisabled : ''}`}
      onClick={() => onClick(tournament)}
      disabled={isDisabled}
      title={isDisabled ? 'Torneo no habilitado por el momento' : ''}
    >
      {/*
        Acá se leía `tournament.emoji`, y **la tabla `tournaments` no tiene esa
        columna**: el emoji de cada torneo vive en `config/tournaments.config.ts`. O
        sea que el `|| '⚽'` era el único camino y todas las tarjetas mostraron
        siempre la pelota genérica. Lo marcó el tipado.

        Si se quiere el emoji real, sale de `getTournamentConfig(tournament.slug)?.emoji`,
        pero eso cambia lo que se ve y es una decisión aparte.
      */}
      <div className={styles.emoji}>⚽</div>
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
