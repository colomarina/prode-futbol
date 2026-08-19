import Button from '../../Common/Button'
import { getRoundDisplayName } from '../../../utils/roundLabels'
import {
  ROUND_STATUSES,
  ROUND_STATUS_ORDER,
  getRoundStatus,
  getFinishability,
} from '../roundStatus'
import type { Round } from '../../../types/domain'
import type { MatchCount } from '../roundStatus'
import styles from './RoundCard.module.css'

/**
 * Una fecha en la lista de administración: su estado, cuántos partidos tiene
 * cargados y las acciones disponibles.
 */
export default function RoundCard({
  round,
  matchCount,
  onChangeStatus,
  onFinish,
}: {
  round: Round
  matchCount: MatchCount | undefined
  onChangeStatus: (status: string) => void
  onFinish: () => void
}) {
  const status = getRoundStatus(round.status)
  const isFinished = round.status === 'finished'
  const isLocked = round.status === 'locked'
  const { canFinish, reason } = getFinishability(matchCount)

  return (
    <div className={styles.card} data-active={round.status === 'open'}>
      <div className={styles.header}>
        <span className={styles.name}>{getRoundDisplayName(round)}</span>

        <span className={styles.badge} data-status={status.key}>
          <span aria-hidden="true">{status.icon}</span>
          <span>{status.label}</span>
        </span>

        {matchCount && (
          <span
            className={styles.matchCount}
            data-complete={matchCount.finished === matchCount.total}
            title={`Partidos finalizados: ${matchCount.finished}/${matchCount.total}`}
          >
            <span aria-hidden="true">⚽</span>
            <span>
              {matchCount.finished}/{matchCount.total}
            </span>
          </span>
        )}
      </div>

      <select
        className={`${styles.statusSelect} ${isLocked ? styles.withAction : ''}`}
        value={round.status}
        onChange={event => onChangeStatus(event.target.value)}
        disabled={isFinished}
        aria-label={`Estado de ${getRoundDisplayName(round)}`}
      >
        {ROUND_STATUS_ORDER.map(value => (
          <option key={value} value={value}>
            {ROUND_STATUSES[value].icon} {ROUND_STATUSES[value].label}
          </option>
        ))}
      </select>

      {isLocked && (
        <Button
          variant="info"
          size="sm"
          fullWidth
          onClick={onFinish}
          disabled={!canFinish}
          title={reason}
        >
          <span aria-hidden="true">✅</span>
          <span>Finalizar{matchCount && ` (${matchCount.finished}/${matchCount.total})`}</span>
        </Button>
      )}
    </div>
  )
}
