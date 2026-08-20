import Badge from '../../Common/Badge'
import MatchStatusBadge from '../MatchStatusBadge'
import { useTournament } from '../../../contexts/TournamentContext'
import { getGroupBadgeColors } from '../../../utils/groupBadgeStyles'
import type { MatchWithTeams } from '../../../types/domain'
import styles from './MatchCardHeader.module.css'

/**
 * El encabezado de la tarjeta de un partido: número, grupo y estado.
 *
 * Estaba duplicado entre `MatchCard` y `MatchDetailCard` —38 de 41 líneas
 * idénticas—, incluido el cálculo de `groupLabel` y de los colores del grupo, que
 * los dos componentes hacían por su cuenta con el mismo código.
 */
export default function MatchCardHeader({ match }: { match: MatchWithTeams }) {
  const { activeTournament } = useTournament()
  const groupLabel = typeof match.group_label === 'string' ? match.group_label.trim() : ''
  const groupBadgeColors = getGroupBadgeColors(groupLabel, activeTournament?.slug)

  return (
    <div className={styles.header}>
      <div className={styles.etiquetas}>
        <Badge tone="primary">Partido #{match.match_number}</Badge>

        {groupLabel && (
          <Badge
            tone="neutral"
            shape="pill"
            style={
              groupBadgeColors
                ? {
                    backgroundColor: groupBadgeColors.backgroundColor,
                    color: groupBadgeColors.color,
                  }
                : undefined
            }
          >
            {groupLabel}
          </Badge>
        )}
      </div>

      <MatchStatusBadge match={match} />
    </div>
  )
}
