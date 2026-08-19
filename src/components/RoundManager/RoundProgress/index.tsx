import { useState, useMemo } from 'react'
import Button from '../../Common/Button'
import PlayerProgressRow from '../PlayerProgressRow'
import { countByProgressLevel } from '../roundStatus'
import type { PlayerProgress } from '../../../hooks/useRoundProgress'
import type { ProgressLevel } from '../roundStatus'
import styles from './RoundProgress.module.css'

const STATS: { level: ProgressLevel; label: string }[] = [
  { level: 'complete', label: 'Completaron' },
  { level: 'partial', label: 'En progreso' },
  { level: 'none', label: 'Sin empezar' },
]

/**
 * Cuánto pronosticó cada jugador en la fecha activa: tres contadores y, si se
 * despliega, el detalle jugador por jugador con los partidos que le faltan.
 *
 * Los jugadores llegan ya filtrados por el hook.
 */
export default function RoundProgress({ players }: { players: PlayerProgress[] }) {
  const [showDetails, setShowDetails] = useState(false)

  const counts = useMemo(() => countByProgressLevel(players), [players])

  // El orden es por progreso descendente: primero los que ya cargaron todo.
  // Se ordena una copia porque `players` viene del cache de React Query.
  const sorted = useMemo(() => [...players].sort((a, b) => b.progress - a.progress), [players])

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.heading}>
          <span className={styles.headingIcon} aria-hidden="true">
            👥
          </span>
          <div>
            <h4 className={styles.title}>Progreso de Usuarios</h4>
            <p className={styles.subtitle}>
              {counts.complete} de {players.length} completaron la fecha
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="success"
          onClick={() => setShowDetails(!showDetails)}
          aria-expanded={showDetails}
        >
          <span aria-hidden="true">{showDetails ? '▼' : '▶'}</span>
          <span>{showDetails ? 'Ocultar detalles' : 'Ver detalles'}</span>
        </Button>
      </div>

      <div className={styles.summary} data-expanded={showDetails}>
        {STATS.map(({ level, label }) => (
          <div key={level} className={styles.stat} data-level={level}>
            <div className={styles.statValue}>{counts[level]}</div>
            <div className={styles.statLabel}>{label}</div>
          </div>
        ))}
      </div>

      {showDetails && (
        <div className={styles.details}>
          {sorted.map(player => (
            <PlayerProgressRow key={player.id} player={player} />
          ))}
        </div>
      )}
    </div>
  )
}
