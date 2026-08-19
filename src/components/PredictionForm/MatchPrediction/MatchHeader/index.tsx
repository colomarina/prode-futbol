import InfoButton from '../../../Common/InfoButton'
import { getGroupBadgeColors } from '../../../../utils/groupBadgeStyles'
import { formatMatchDateShort, formatMatchTime } from '../../../../utils/matchDate'
import type { MatchWithTeams } from '../../../../types/domain'
import type { MatchStatus } from '../matchWarnings'
import styles from './MatchHeader.module.css'

const STATUS_LABELS: Record<MatchStatus, string> = {
  finished: 'Finalizado',
  playing: '⚽ En Juego',
}

/**
 * Encabezado de la tarjeta de pronóstico: número de partido, estado, grupo y
 * fecha.
 */
export default function MatchHeader({
  match,
  status,
  isGameOfTheRound,
  tournamentSlug,
}: {
  match: MatchWithTeams
  status: MatchStatus | null
  isGameOfTheRound?: boolean
  tournamentSlug?: string
}) {
  const groupLabel = typeof match.group_label === 'string' ? match.group_label.trim() : ''
  const groupColors = getGroupBadgeColors(groupLabel, tournamentSlug)

  return (
    <>
      <div className={styles.matchNumber}>#{match.match_number || '?'}</div>

      {isGameOfTheRound && (
        <div className={styles.info}>
          <InfoButton message="Partido de la fecha" ariaLabel="Partido de la fecha" />
        </div>
      )}

      {status && (
        <div className={styles.status} data-status={status}>
          {STATUS_LABELS[status]}
        </div>
      )}

      <div className={styles.meta}>
        {groupLabel && (
          <div className={styles.group}>
            {/* En el Mundial cada grupo tiene su propio color. */}
            <span className={styles.groupBadge} style={groupColors ?? undefined}>
              {groupLabel}
            </span>
          </div>
        )}
        <span className={styles.datetime}>
          📅 {formatMatchDateShort(match.match_date)} • 🕐 {formatMatchTime(match.match_date)}
        </span>
      </div>
    </>
  )
}
