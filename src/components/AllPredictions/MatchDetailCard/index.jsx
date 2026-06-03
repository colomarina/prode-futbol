import TeamDisplay from '../../Common/TeamDisplay'
import MatchStatusBadge from '../MatchStatusBadge'
import { useTournament } from '../../../contexts/TournamentContext'
import { getGroupBadgeColors } from '../../../utils/groupBadgeStyles'

const MatchDetailCard = ({ match }) => {
  const { activeTournament } = useTournament()
  const groupLabel = typeof match.group_label === 'string' ? match.group_label.trim() : ''
  const groupBadgeColors = getGroupBadgeColors(groupLabel, activeTournament?.slug)

  return (
    <div
      className="card"
      style={{
        padding: '16px',
        marginBottom: '16px',
        background:
          'linear-gradient(to bottom, var(--color-surface), var(--color-surface-variant))',
        border: '1px solid var(--color-border)',
        borderRadius: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          paddingBottom: '8px',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              padding: '4px 10px',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: '700',
            }}
          >
            Partido #{match.match_number}
          </span>
          {groupLabel && (
            <span
              style={{
                backgroundColor: groupBadgeColors?.backgroundColor || 'var(--color-primary-light)',
                color: groupBadgeColors?.color || 'var(--color-primary-dark)',
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '0.72rem',
                fontWeight: '700',
              }}
            >
              {groupLabel}
            </span>
          )}
        </div>
        <MatchStatusBadge match={match} />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gap: '12px',
          alignItems: 'center',
        }}
      >
        <div style={{ justifySelf: 'end', textAlign: 'center' }}>
          <TeamDisplay team={match.home_team} size="sm" showNameBelow />
        </div>

        <div style={{ textAlign: 'center', minWidth: '80px' }}>
          <div
            style={{
              fontSize: '0.7rem',
              color: 'var(--color-text-secondary)',
              marginBottom: '2px',
            }}
          >
            Resultado Real
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--color-primary)' }}>
            {match.is_finished
              ? `${match.home_score ?? '-'} - ${match.away_score ?? '-'}`
              : 'En juego'}
          </div>
          {match.is_finished && match.qualifier_team && (
            <div
              style={{
                marginTop: '8px',
                padding: '8px',
                backgroundColor: 'var(--color-primary-light)',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: '800',
                color: 'var(--color-text)',
              }}
            >
              🏆 Clasificó: {match.qualifier_team.name}
            </div>
          )}
        </div>

        <div style={{ justifySelf: 'start', textAlign: 'center' }}>
          <TeamDisplay team={match.away_team} size="sm" showNameBelow />
        </div>
      </div>
    </div>
  )
}

export default MatchDetailCard
