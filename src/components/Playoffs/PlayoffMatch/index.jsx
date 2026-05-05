import { memo } from 'react'
import TeamDisplay from '../../Common/TeamDisplay'

function resolveTeamName(teamId, match) {
  if (!teamId) return 'Sin definir'
  if (teamId === match.home_team_id) return match.home_team?.name || 'Local'
  if (teamId === match.away_team_id) return match.away_team?.name || 'Visitante'
  return 'Sin definir'
}

const PlayoffMatch = memo(function PlayoffMatch({ match, prediction = null }) {
  const isTie = match.home_score === match.away_score
  const hasStarted = new Date() >= new Date(match.match_date)
  const qualifierName = resolveTeamName(match.qualifier_team_id, match)
  const predictionQualifierName = resolveTeamName(prediction?.qualifier_prediction_id, match)
  const hitQualifier =
    prediction?.qualifier_prediction_id &&
    match.qualifier_team_id &&
    prediction.qualifier_prediction_id === match.qualifier_team_id

  const matchDate = new Date(match.match_date)
  const formattedDate = matchDate.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    weekday: 'short',
    timeZone: 'America/Argentina/Buenos_Aires',
  })
  const formattedTime = matchDate.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Argentina/Buenos_Aires',
  })

  return (
    <article
      className="card"
      style={{
        margin: 0,
        padding: '12px',
        border: '1px solid var(--color-border)',
        background:
          'linear-gradient(145deg, var(--color-surface) 0%, var(--color-surface-variant) 100%)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: '700' }}>
          #{match.match_number || '?'}
        </span>
        <span
          style={{
            fontSize: '0.78rem',
            color: 'var(--color-text-secondary)',
            background: 'var(--color-surface-highlight)',
            borderRadius: '8px',
            padding: '2px 8px',
          }}
        >
          {match.is_finished ? 'Finalizado' : hasStarted ? 'En juego' : `${formattedDate} ${formattedTime}`}
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gap: '10px',
          alignItems: 'center',
          marginBottom: '10px',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <TeamDisplay team={match.home_team} size="sm" showNameBelow />
        </div>

        <div
          style={{
            minWidth: '64px',
            textAlign: 'center',
            fontWeight: '800',
            color: 'var(--color-primary)',
            fontSize: '1.1rem',
          }}
        >
          {match.is_finished ? `${match.home_score} - ${match.away_score}` : 'vs'}
        </div>

        <div style={{ textAlign: 'center' }}>
          <TeamDisplay team={match.away_team} size="sm" showNameBelow />
        </div>
      </div>

      {match.is_finished && match.is_playoff && isTie && match.qualifier_team_id && (
        <p
          style={{
            margin: '0 0 6px 0',
            fontSize: '0.82rem',
            color: 'var(--color-text-primary)',
            fontWeight: '700',
          }}
        >
          En penales clasifica: {qualifierName}
        </p>
      )}

      {match.is_finished && match.qualifier_team_id && (
        <p style={{ margin: '0 0 6px 0', fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
          Clasificó: {qualifierName}
        </p>
      )}

      {prediction && (
        <div
          style={{
            marginTop: '8px',
            borderTop: '1px dashed var(--color-border)',
            paddingTop: '8px',
            fontSize: '0.8rem',
          }}
        >
          <p style={{ margin: '0 0 4px 0', color: 'var(--color-text-secondary)' }}>
            Tu pronóstico: {prediction.home_prediction} - {prediction.away_prediction}
          </p>
          {prediction?.qualifier_prediction_id && (
            <p style={{ margin: '0 0 4px 0', color: 'var(--color-text-secondary)' }}>
              Elegiste que clasifica: {predictionQualifierName}{' '}
              {match.is_finished && match.is_playoff && isTie ? (hitQualifier ? '✅' : '❌') : ''}
            </p>
          )}
          <p style={{ margin: 0, fontWeight: '700', color: 'var(--color-primary)' }}>
            {prediction.points || 0} pts
          </p>
        </div>
      )}
    </article>
  )
})

export default PlayoffMatch
