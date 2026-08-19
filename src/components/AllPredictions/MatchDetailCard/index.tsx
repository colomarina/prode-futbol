import TeamDisplay from '../../Common/TeamDisplay'
import MatchCardHeader from '../MatchCardHeader'
import type { MatchWithTeams } from '../../../types/domain'
import styles from './MatchDetailCard.module.css'

/**
 * La tarjeta del partido elegido, arriba de la lista de pronósticos.
 *
 * El encabezado —número, grupo y estado— se fue a `MatchCardHeader`, que era 38
 * de 41 líneas idénticas a las de `MatchCard`.
 */
const MatchDetailCard = ({ match }: { match: MatchWithTeams }) => {
  return (
    <div className={styles.card}>
      <MatchCardHeader match={match} />

      <div className={styles.cuerpo}>
        <div className={styles.equipoLocal}>
          <TeamDisplay team={match.home_team} size="sm" showNameBelow />
        </div>

        <div className={styles.marcador}>
          <div className={styles.etiqueta}>Resultado Real</div>
          <div className={styles.numeros}>
            {match.is_finished
              ? `${match.home_score ?? '-'} - ${match.away_score ?? '-'}`
              : 'En juego'}
          </div>
          {match.is_finished && match.qualifier_team && (
            <div className={styles.clasificado}>🏆 Clasificó: {match.qualifier_team.name}</div>
          )}
        </div>

        <div className={styles.equipoVisitante}>
          <TeamDisplay team={match.away_team} size="sm" showNameBelow />
        </div>
      </div>
    </div>
  )
}

export default MatchDetailCard
