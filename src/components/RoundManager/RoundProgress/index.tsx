import { useMemo } from 'react'
import PlayerProgressRow from '../PlayerProgressRow'
import { countByProgressLevel } from '../progress'
import type { PlayerProgress } from '../../../hooks/useRoundProgress'
import type { ProgressLevel } from '../progress'
import styles from './RoundProgress.module.css'

const STATS: { level: ProgressLevel; label: string }[] = [
  { level: 'complete', label: 'Completaron' },
  { level: 'partial', label: 'A medias' },
  { level: 'none', label: 'Sin empezar' },
]

export default function RoundProgress({
  players,
  matchLabels,
}: {
  players: PlayerProgress[]
  matchLabels: Record<number, string>
}) {
  const counts = useMemo(() => countByProgressLevel(players), [players])
  const sorted = useMemo(
    () =>
      [...players].sort((a, b) => a.progress - b.progress || a.name.localeCompare(b.name, 'es')),
    [players]
  )

  return (
    <div>
      <div className={styles.summary}>
        {STATS.map(({ level, label }) => (
          <div key={level} className={styles.stat} data-level={level}>
            <div className={styles.statValue}>{counts[level]}</div>
            <div className={styles.statLabel}>{label}</div>
          </div>
        ))}
      </div>

      <ul className={styles.details} aria-label="Progreso de cada jugador">
        {sorted.map(player => (
          <PlayerProgressRow key={player.id} player={player} matchLabels={matchLabels} />
        ))}
      </ul>
    </div>
  )
}
