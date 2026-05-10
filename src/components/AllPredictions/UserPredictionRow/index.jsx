const resolveTeamById = (teamId, match) => {
  if (!teamId || !match) return null
  if (teamId === match.home_team_id) return match.home_team
  if (teamId === match.away_team_id) return match.away_team
  return null
}

const resolvePredictedQualifierTeam = (prediction, match) => {
  if (!prediction || !match?.is_playoff) return null

  const home = Number(prediction.home_prediction)
  const away = Number(prediction.away_prediction)

  if (home > away) return match.home_team
  if (away > home) return match.away_team

  return resolveTeamById(prediction.qualifier_prediction_id, match)
}

const UserPredictionRow = ({ user, prediction, isFinished, match }) => {
  const showPlayoffColumn = Boolean(match?.is_playoff)
  const qualifierPredictionTeam = resolvePredictedQualifierTeam(prediction, match)
  const showQualifierTeam = Boolean(showPlayoffColumn && qualifierPredictionTeam)

  return (
    <div
      className="card match-prediction-row"
      style={{
        padding: '10px 12px',
        background:
          'linear-gradient(to bottom, var(--color-surface), var(--color-surface-variant))',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        display: 'grid',
        gridTemplateColumns: showPlayoffColumn ? 'minmax(0, 1fr) auto auto' : 'minmax(0, 1fr) auto',
        gridTemplateAreas: showPlayoffColumn
          ? "'user user points' 'prediction qualifier points'"
          : "'user points' 'prediction points'",
        columnGap: '12px',
        rowGap: '6px',
        alignItems: 'center',
      }}
    >
      <div className="match-prediction-user" style={{ gridArea: 'user', minWidth: 0 }}>
        <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--color-text-primary)' }}>
          {user.username}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
          @{user.full_name}
        </div>
      </div>

      <div
        className="match-prediction-main"
        style={{ gridArea: 'prediction', minWidth: 0, alignSelf: 'start' }}
      >
        {prediction && (
          <>
            <div
              style={{
                fontSize: '0.7rem',
                color: 'var(--color-text-secondary)',
                marginBottom: '2px',
              }}
            >
              Pronóstico
            </div>
            <div
              style={{
                fontSize: '1.2rem',
                fontWeight: '700',
                color: 'var(--color-primary)',
                lineHeight: 1.1,
              }}
            >
              {prediction.home_prediction} - {prediction.away_prediction}
            </div>
          </>
        )}
      </div>

      {showPlayoffColumn && (
        <div
          className="match-prediction-qualifier"
          style={{ gridArea: 'qualifier', minWidth: 0, alignSelf: 'start' }}
        >
          <div
            style={{
              fontSize: '0.7rem',
              color: 'var(--color-text-secondary)',
              marginBottom: '2px',
            }}
          >
            Clasifica
          </div>
          {showQualifierTeam ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 8px',
                backgroundColor: 'var(--color-primary-light)',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: 'var(--color-text)',
              }}
            >
              {qualifierPredictionTeam.logo_url && (
                <img
                  src={qualifierPredictionTeam.logo_url}
                  alt={qualifierPredictionTeam.name}
                  style={{ width: '16px', height: '16px', objectFit: 'contain' }}
                />
              )}
              <span className="qualifier-team-name">{qualifierPredictionTeam.name}</span>
            </div>
          ) : (
            <div
              style={{
                fontSize: '0.78rem',
                color: 'var(--color-text-secondary)',
                fontStyle: 'italic',
              }}
            >
              -
            </div>
          )}
        </div>
      )}

      <div className="match-prediction-score" style={{ gridArea: 'points', textAlign: 'right' }}>
        {isFinished && (
          <div
            style={{
              fontSize: '0.85rem',
              fontWeight: '700',
              color: prediction.points > 0 ? '#10b981' : '#ef4444',
              whiteSpace: 'nowrap',
            }}
          >
            {prediction.points > 0 ? '✅' : '❌'} {prediction.points} pts
          </div>
        )}
      </div>

      <style>{`
        @media (min-width: 768px) {
          .match-prediction-row {
            grid-template-columns: ${showPlayoffColumn ? 'minmax(170px, 1fr) auto minmax(150px, 1fr) auto' : 'minmax(170px, 1fr) auto auto'} !important;
            grid-template-areas: ${showPlayoffColumn ? "'user prediction qualifier points'" : "'user prediction points'"} !important;
            row-gap: 0 !important;
          }
          .match-prediction-main {
            justify-self: center;
            text-align: center;
          }
          .match-prediction-qualifier {
            justify-self: start;
            text-align: left;
          }
          .match-prediction-score {
            min-width: 92px;
          }
        }

        @media (max-width: 767px) {
          .qualifier-team-name {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}

export default UserPredictionRow
