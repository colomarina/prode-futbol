import { memo } from 'react'
import TeamDisplay from '../../Common/TeamDisplay'
import { resolveTeamName } from '../../../utils/teams'
import { formatMatchDateNumeric, formatMatchTime } from '../../../utils/matchDate'

const PlayoffMatch = memo(function PlayoffMatch({ match, prediction = null }) {
  const isTie = match.home_score === match.away_score
  const hasStarted = new Date() >= new Date(match.match_date)
  const qualifierName = resolveTeamName(match.qualifier_team_id, match)
  const predictionQualifierName = resolveTeamName(prediction?.qualifier_prediction_id, match)
  const hitQualifier =
    prediction?.qualifier_prediction_id &&
    match.qualifier_team_id &&
    prediction.qualifier_prediction_id === match.qualifier_team_id

  const formattedDate = formatMatchDateNumeric(match.match_date)
  const formattedTime = formatMatchTime(match.match_date)

  return (
    <article
      className="card"
      style={{
        margin: 0,
        padding: 'var(--space-md)',
        border: '1px solid var(--color-border)',
        background:
          'linear-gradient(145deg, var(--color-surface) 0%, var(--color-surface-variant) 100%)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-sm)',
        }}
      >
        <span
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
            fontWeight: '700',
          }}
        >
          #{match.match_number || '?'}
        </span>
        <span
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
            background: 'var(--color-surface-highlight)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-3xs) var(--space-sm)',
          }}
        >
          {match.is_finished
            ? 'Finalizado'
            : hasStarted
              ? 'En juego'
              : `${formattedDate} ${formattedTime}`}
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gap: 'var(--space-sm)',
          alignItems: 'center',
          marginBottom: 'var(--space-sm)',
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
            color: 'var(--color-primary-text)',
            fontSize: 'var(--font-size-lg)',
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
            margin: '0 0 var(--space-xs) 0',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-primary)',
            fontWeight: '700',
          }}
        >
          En penales clasifica: {qualifierName}
        </p>
      )}

      {match.is_finished && match.qualifier_team_id && (
        <p
          style={{
            margin: '0 0 var(--space-xs) 0',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
          }}
        >
          Clasificó: {qualifierName}
        </p>
      )}

      {prediction && (
        <div
          style={{
            marginTop: 'var(--space-sm)',
            borderTop: '1px dashed var(--color-border)',
            paddingTop: 'var(--space-sm)',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          <p style={{ margin: '0 0 var(--space-2xs) 0', color: 'var(--color-text-secondary)' }}>
            Tu pronóstico: {prediction.home_prediction} - {prediction.away_prediction}
          </p>
          {prediction?.qualifier_prediction_id && (
            <p style={{ margin: '0 0 var(--space-2xs) 0', color: 'var(--color-text-secondary)' }}>
              Elegiste que clasifica: {predictionQualifierName}{' '}
              {match.is_finished && match.is_playoff && isTie ? (hitQualifier ? '✅' : '❌') : ''}
            </p>
          )}
          <p style={{ margin: 0, fontWeight: '700', color: 'var(--color-primary-text)' }}>
            {prediction.points || 0} pts
          </p>
        </div>
      )}
    </article>
  )
})

export default PlayoffMatch
