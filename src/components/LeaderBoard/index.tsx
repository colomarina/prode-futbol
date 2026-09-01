import { useMemo, useState } from 'react'
import { useLeaderboard } from '../../hooks/useLeaderboard'
import { useRounds } from '../../hooks/useRounds'
import { useMatchesMeta } from '../../hooks/useMatchesMeta'
import { useTournament } from '../../contexts/TournamentContext'
import { getLeaderboardRounds } from '../../utils/leaderboardRounds'
import LeaderboardHeader from './LeadboardHeader'
import LeaderboardTable from './LeaderboardTable'
import LeaderboardTableSkeleton from './LeaderboardTableSkeleton'
import ErrorMessage from '../Common/ErrorMessage'
import type { LeaderboardSelection } from './LeadboardHeader'
import type { ViewPredictionsRequest } from './LeaderboardRow'

export default function Leaderboard({
  onViewPredictions,
}: {
  onViewPredictions?: (request: ViewPredictionsRequest) => void
}) {
  const [selectedRound, setSelectedRound] = useState<LeaderboardSelection>(null)
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
        {/*
         * Durante la carga se cambia solo la tabla, no la pantalla entera. Antes
         * `loading` devolvia un spinner en lugar de todo el contenido, asi que el
         * header y el selector de fecha tampoco se veian: al llegar los datos
         * aparecia todo de golpe. Ni el header ni el selector dependen de esta
         * consulta, asi que no tienen por que esperarla.
         */}
        {loading ? (
          <LeaderboardTableSkeleton selectedRound={selectedRound} />
        ) : (
          <LeaderboardTable
            leaderboard={leaderboard}
            selectedRound={selectedRound}
            onViewPredictions={onViewPredictions}
          />
        )}
      </div>
    </div>
  )
}
