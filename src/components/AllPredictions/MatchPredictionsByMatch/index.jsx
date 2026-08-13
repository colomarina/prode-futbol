import MatchDetailCard from '../MatchDetailCard'
import UserPredictionRow from '../UserPredictionRow'
import LoadingState from '../../Common/LoadingState'

const MatchPredictionsByMatch = ({ selectedMatch, users, matchPredictions, matchLoading }) => {
  return (
    <div>
      {selectedMatch && <MatchDetailCard match={selectedMatch} />}

      {matchLoading ? (
        <LoadingState
          message="Cargando pronósticos..."
          size="md"
          style={{ padding: 'var(--space-2xl)' }}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {users
            .filter(user => matchPredictions[user.id])
            .map(user => (
              <UserPredictionRow
                key={user.id}
                user={user}
                prediction={matchPredictions[user.id]}
                isFinished={selectedMatch?.is_finished}
                match={selectedMatch}
              />
            ))}
        </div>
      )}
    </div>
  )
}

export default MatchPredictionsByMatch
