import { resolveTeamName } from '../../../../utils/teams'
import styles from './MatchOutcome.module.css'

/**
 * Resultado de un partido terminado y cuántos puntos dio el pronóstico.
 *
 * Los puntos los escribe Supabase; acá solo se leen. Si el usuario no pronosticó
 * se muestra el resultado igual, sin el chip de puntos.
 *
 * @param {{ match: object, prediction: object|null }} props
 */
export default function MatchOutcome({ match, prediction }) {
  const scored = (prediction?.points ?? 0) > 0
  const predictedQualifier = prediction?.qualifier_prediction_id

  return (
    <div className={styles.panel} data-scored={scored}>
      <div className={styles.row}>
        <div>
          <p className={styles.result}>
            ⚽ Resultado Final:{' '}
            <span className={styles.score}>
              {match.home_score} - {match.away_score}
            </span>
          </p>

          {prediction && (
            <p className={styles.detail}>
              Tu pronóstico: {prediction.home_prediction} - {prediction.away_prediction}
            </p>
          )}

          {match.is_playoff && match.qualifier_team_id && (
            <p className={styles.detail}>
              Clasificó: {resolveTeamName(match.qualifier_team_id, match)}{' '}
              {/* Sin pronóstico de clasificado no va ni tilde ni cruz. */}
              {predictedQualifier
                ? predictedQualifier === match.qualifier_team_id
                  ? '✅'
                  : '❌'
                : ''}
            </p>
          )}
        </div>

        {prediction && (
          <div className={styles.points} data-scored={scored}>
            <span className={styles.pointsIcon} aria-hidden="true">
              {scored ? '✅' : '❌'}
            </span>
            <span>{prediction.points || 0} pts</span>
          </div>
        )}
      </div>
    </div>
  )
}
