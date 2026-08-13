import TeamDisplay from '../../Common/TeamDisplay'
import MatchCardHeader from '../MatchCardHeader'
import { resolveTeamById } from '../../../utils/teams'
import styles from './MatchCard.module.css'

/**
 * La tarjeta de un partido con el pronóstico de un jugador.
 *
 * El encabezado se fue a `MatchCardHeader`: eran 38 de 41 líneas idénticas a las
 * de `MatchDetailCard`, incluido el cálculo de los colores del grupo.
 */
const MatchCard = ({ match, prediction, started }) => {
  const isTiePrediction =
    prediction && Number(prediction.home_prediction) === Number(prediction.away_prediction)
  const qualifierPredictionTeam = resolveTeamById(prediction?.qualifier_prediction_id, match)

  return (
    // La opacidad marca los partidos que todavía no empezaron: el pronóstico de
    // los demás no se puede espiar antes de que arranque.
    <div className={`${styles.card} ${started ? '' : styles.noEmpezado}`}>
      <MatchCardHeader match={match} />

      <div className={styles.cuerpo}>
        <div className={styles.equipoLocal}>
          <TeamDisplay team={match.home_team} size="sm" showNameBelow />
        </div>

        <div className={styles.centro}>
          {prediction ? (
            <div>
              <div className={styles.etiqueta}>Pronóstico</div>
              <div className={styles.marcador}>
                {prediction.home_prediction} - {prediction.away_prediction}
              </div>

              {match.is_finished && (
                <div className={styles.resultado}>
                  <div className={styles.etiquetaChica}>Resultado Real</div>
                  <div className={styles.resultadoReal}>
                    {match.home_score} - {match.away_score}
                  </div>
                  <div
                    className={`${styles.puntos} ${
                      prediction.points > 0 ? styles.acerto : styles.fallo
                    }`}
                  >
                    {prediction.points > 0 ? '✅' : '❌'} {prediction.points} pts
                  </div>

                  {match.is_playoff && isTiePrediction && qualifierPredictionTeam && (
                    <div className={styles.chip}>
                      <span className={styles.chipLabel}>🥊 Pasa:</span>
                      {qualifierPredictionTeam.logo_url && (
                        <img
                          src={qualifierPredictionTeam.logo_url}
                          alt={qualifierPredictionTeam.name}
                          className={styles.chipLogo}
                        />
                      )}
                      <span className={styles.chipNombre}>{qualifierPredictionTeam.name}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className={styles.sinPronostico}>Sin pronóstico</div>
          )}
        </div>

        <div className={styles.equipoVisitante}>
          <TeamDisplay team={match.away_team} size="sm" showNameBelow />
        </div>
      </div>
    </div>
  )
}

export default MatchCard
