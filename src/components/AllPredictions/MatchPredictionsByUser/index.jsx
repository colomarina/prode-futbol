import MatchCard from '../MatchCard'
import LoadingState from '../../Common/LoadingState'

const MatchPredictionsByUser = ({ matches, roundPredictions, hasMatchStarted, loading }) => {
  if (loading)
    return (
      <LoadingState
        message="Cargando pronósticos..."
        size="md"
        style={{ padding: 'var(--space-2xl)' }}
      />
    )

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {matches.map(match => (
          <MatchCard
            key={match.id}
            match={match}
            prediction={roundPredictions[match.id]}
            started={hasMatchStarted(match)}
          />
        ))}
      </div>
    </div>
  )
}

export default MatchPredictionsByUser
