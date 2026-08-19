import MatchDetailCard from '../MatchDetailCard'
import UserPredictionRow from '../UserPredictionRow'
import LoadingState from '../../Common/LoadingState'
import type { MatchWithTeams } from '../../../types/domain'
import type { PredictionsByKey, PredictionsUser } from '../../../hooks/useAllPredictions'

interface MatchPredictionsByMatchProps {
  selectedMatch?: MatchWithTeams | null
  users: PredictionsUser[]
  /** Indexados por id de usuario. */
  matchPredictions: PredictionsByKey
  matchLoading?: boolean
}

const MatchPredictionsByMatch = ({
  selectedMatch,
  users,
  matchPredictions,
  matchLoading,
}: MatchPredictionsByMatchProps) => {
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
