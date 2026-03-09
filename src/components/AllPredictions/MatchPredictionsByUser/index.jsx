import MatchCard from '../MatchCard'
import LoadingState from '../../Common/LoadingState'

const MatchPredictionsByUser = ({ matches, roundPredictions, hasMatchStarted, loading }) => {
  if (loading)
    return (
      <LoadingState message="Cargando pronósticos..." style={{ padding: '40px' }} spacing="16px" />
    )

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
