import { useState } from 'react'
import { useLeaderboard } from '../../hooks/useLeaderboard'
import { useRounds } from '../../hooks/useRounds'
import { useTournament } from '../../contexts/TournamentContext'
import LeaderboardHeader from './LeadboardHeader'
import LeaderboardTable from './LeaderboardTable'
import LoadingSpinner from './LoadingSpinner'
import ErrorMessage from './ErrorMessage'

export default function Leaderboard({ onViewPredictions }) {
  const [selectedRound, setSelectedRound] = useState(null)
  const { activeTournament } = useTournament()
  const { leaderboard, loading, error } = useLeaderboard(
    selectedRound,
    activeTournament?.id,
    activeTournament?.type === 'world_cup'
  )
  const { rounds, loading: roundsLoading } = useRounds(activeTournament?.id)

  if (loading) {
    return (
      <div className="container" style={{ maxWidth: '1000px', textAlign: 'center' }}>
        <LoadingSpinner size="md" label="Cargando tabla de posiciones..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container" style={{ maxWidth: '1000px' }}>
        <ErrorMessage error={error} />
      </div>
    )
  }

  return (
    <div className="container" style={{ maxWidth: '1000px' }}>
      <LeaderboardHeader
        selectedRound={selectedRound}
        setSelectedRound={setSelectedRound}
        rounds={rounds}
        roundsLoading={roundsLoading}
        isWorldCupTournament={activeTournament?.type === 'world_cup'}
      />

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <LeaderboardTable
          leaderboard={leaderboard}
          selectedRound={selectedRound}
          onViewPredictions={onViewPredictions}
        />
      </div>
    </div>
  )
}
