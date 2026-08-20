import MatchCard from '../MatchCard'
import LoadingState from '../../Common/LoadingState'
import type { IsoDate, MatchWithTeams } from '../../../types/domain'
import type { PredictionsByKey } from '../../../hooks/useAllPredictions'

interface MatchPredictionsByUserProps {
  matches: MatchWithTeams[]
  /** Indexados por id de partido. */
  roundPredictions: PredictionsByKey
  hasMatchStarted: (matchDate: IsoDate) => boolean
  loading?: boolean
}

const MatchPredictionsByUser = ({
  matches,
  roundPredictions,
  hasMatchStarted,
  loading,
}: MatchPredictionsByUserProps) => {
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
            // Acá se pasaba el partido entero y `hasMatchStarted` espera la fecha:
            // `new Date(objeto)` es Invalid Date, la comparación daba siempre false y
            // **todas** las tarjetas quedaban atenuadas como si no hubiera empezado
            // ninguna. Lo encontró el tipado; el resto de los llamadores ya pasaba
            // `match.match_date`.
            started={hasMatchStarted(match.match_date)}
          />
        ))}
      </div>
    </div>
  )
}

export default MatchPredictionsByUser
