import { useMemo, useState } from 'react'
import { useLeaderboard } from '../../hooks/useLeaderboard'
import { useRounds } from '../../hooks/useRounds'
import { useMatchesMeta } from '../../hooks/useMatchesMeta'
import { useTournament } from '../../contexts/TournamentContext'
import { getLeaderboardRounds } from '../../utils/leaderboardRounds'
import LeaderboardHeader from './LeadboardHeader'
import LeaderboardTable from './LeaderboardTable'
import LoadingSpinner from './LoadingSpinner'
import ErrorMessage from './ErrorMessage'

export default function Leaderboard({ onViewPredictions }) {
  const [selectedRound, setSelectedRound] = useState(null)
  const { activeTournament } = useTournament()
  const isWorldCupTournament = activeTournament?.type === 'world_cup'
  const { leaderboard, loading, error, fetchLeaderboard } = useLeaderboard(
    selectedRound,
    activeTournament?.id,
    isWorldCupTournament
  )
  const { rounds, loading: roundsLoading } = useRounds(activeTournament?.id)
  const { matchesMeta } = useMatchesMeta(activeTournament?.id)

  const { individualRounds, showPlayoffs } = useMemo(
    () => getLeaderboardRounds({ rounds, matchesMeta, isWorldCupTournament }),
    [rounds, matchesMeta, isWorldCupTournament]
  )

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
        <ErrorMessage error={error} onRetry={fetchLeaderboard} />
      </div>
    )
  }

  return (
    <div className="container" style={{ maxWidth: '1000px' }}>
      <LeaderboardHeader
        selectedRound={selectedRound}
        setSelectedRound={setSelectedRound}
        rounds={individualRounds}
        roundsLoading={roundsLoading}
        showPlayoffs={showPlayoffs}
        isWorldCupTournament={isWorldCupTournament}
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
