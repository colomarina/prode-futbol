import { resolvePredictedQualifierTeam } from '../../../utils/teams'
import type { MatchWithTeams, Prediction } from '../../../types/domain'
import type { PredictionsUser } from '../../../hooks/useAllPredictions'
import styles from './UserPredictionRow.module.css'

interface UserPredictionRowProps {
  user: PredictionsUser
  prediction: Prediction
  isFinished?: boolean | null
  match?: MatchWithTeams | null
}

const UserPredictionRow = ({ user, prediction, isFinished, match }: UserPredictionRowProps) => {
  const showPlayoffColumn = Boolean(match?.is_playoff)
  const qualifierPredictionTeam = resolvePredictedQualifierTeam(prediction, match)
  const showQualifierTeam = Boolean(showPlayoffColumn && qualifierPredictionTeam)

  return (
    <div className={`${styles.row} ${showPlayoffColumn ? styles.playoff : ''}`}>
      <div className={styles.user}>
        <div className={styles.username}>{user.username}</div>
        <div className={styles.fullName}>@{user.full_name}</div>
      </div>

      <div className={styles.main}>
        {prediction && (
          <>
            <div className={styles.etiqueta}>Pronóstico</div>
            <div className={styles.marcador}>
              {prediction.home_prediction} - {prediction.away_prediction}
            </div>
          </>
        )}
      </div>

      {showPlayoffColumn && (
        <div className={styles.qualifier}>
          <div className={styles.etiqueta}>Clasifica</div>
          {showQualifierTeam ? (
            <div className={styles.chip}>
              {qualifierPredictionTeam.logo_url && (
                <img
                  src={qualifierPredictionTeam.logo_url}
                  alt={qualifierPredictionTeam.name}
                  className={styles.chipLogo}
                />
              )}
              <span className={styles.chipNombre}>{qualifierPredictionTeam.name}</span>
            </div>
          ) : (
            <div className={styles.vacio}>-</div>
          )}
        </div>
      )}

      <div className={styles.score}>
        {isFinished && (
          <div
            className={`${styles.puntos} ${prediction.points > 0 ? styles.acerto : styles.fallo}`}
          >
            {prediction.points > 0 ? '✅' : '❌'} {prediction.points} pts
          </div>
        )}
      </div>
    </div>
  )
}

export default UserPredictionRow
