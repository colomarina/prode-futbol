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
          style={{ padding: '40px' }}
          spacing="16px"
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {users
            .filter(user => matchPredictions[user.id])
            .map(user => (
              <UserPredictionRow
                key={user.id}
                user={user}
                prediction={matchPredictions[user.id]}
                isFinished={selectedMatch?.is_finished}
              />
            ))}
        </div>
      )}

      <style>{`
        @media (max-width: 767px) {
          .match-prediction-score { min-width: 80px; }
        }
      `}</style>
    </div>
  )
}

export default MatchPredictionsByMatch
