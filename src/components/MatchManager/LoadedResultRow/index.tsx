import MatchupLogos from '../../Common/MatchupLogos'
import type { MatchWithTeams } from '../../../types/domain'
import styles from './LoadedResultRow.module.css'

export default function LoadedResultRow({ match }: { match: MatchWithTeams }) {
  const isPenaltyTie =
    match.is_playoff && match.home_score === match.away_score && Boolean(match.qualifier_team)

  return (
    <li className={styles.row}>
      <span className={styles.matchup}>
        <MatchupLogos
          home={match.home_team}
          away={match.away_team}
          middle={
            <span className={styles.score}>
              {match.home_score} - {match.away_score}
            </span>
          }
        />
      </span>
      <span className={styles.check} role="img" aria-label="Resultado cargado">
        ✓
      </span>
      {isPenaltyTie && (
        <p className={styles.extra}>Pasa {match.qualifier_team?.name} por penales</p>
      )}
    </li>
  )
}
