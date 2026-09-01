import { useAllPredictions } from '../../hooks/useAllPredictions'
import ViewModeToggle from './ViewModeToggle'
import RoundUserSelectors from './RoundUserSelectors'
import MatchPredictionsByUser from './MatchPredictionsByUser'
import MatchPredictionsByMatch from './MatchPredictionsByMatch'
import EmptyState from './EmptyState'
import LoadingState from '../Common/LoadingState'
import type { Uuid } from '../../types/domain'

export default function AllPredictions({
  initialRound = null,
  initialUser = '',
}: {
  /** Fecha con la que se entra desde un deep link. */
  initialRound?: number | null
  /** Jugador con el que se entra desde el 👀 de la tabla de posiciones. */
  initialUser?: Uuid | ''
}) {
  const {
    roundsLoading,
    availableRounds,
    matches,
    matchesLoading,
    users,
    selectedUser,
    setSelectedUser,
    selectedRound,
    setSelectedRound,
    selectedMatchId,
    setSelectedMatchId,
    selectedMatch,
    viewMode,
    setViewMode,
    roundPredictions,
    matchPredictions,
    loading,
    matchLoading,
    hasMatchStarted,
  } = useAllPredictions({ initialRound, initialUser })

  if (roundsLoading)
    return (
      <div className="container">
        <LoadingState message="Cargando..." />
      </div>
    )

  const noSelection =
    !selectedRound ||
    (viewMode === 'by-user' && !selectedUser) ||
    (viewMode === 'by-match' && !selectedMatchId)

  const selectedRoundHasStartedMatches = matches.some(match => hasMatchStarted(match.match_date))
  const selectedMatchHasStarted = selectedMatch ? hasMatchStarted(selectedMatch.match_date) : false

  const showByUser =
    viewMode === 'by-user' &&
    selectedRound &&
    selectedUser &&
    !matchesLoading &&
    matches.length > 0 &&
    selectedRoundHasStartedMatches

  const showByMatch =
    viewMode === 'by-match' &&
    selectedRound &&
    selectedMatchId &&
    !matchesLoading &&
    matches.length > 0 &&
    selectedMatchHasStarted

  return (
    <div className="container" style={{ maxWidth: '1000px' }}>
      <div style={{ marginBottom: 'var(--space-md)', textAlign: 'center' }}>
        <h2
          style={{
            fontSize: 'var(--font-size-lg)',
            fontWeight: '700',
            color: 'var(--color-primary-text)',
            marginBottom: 'var(--space-sm)',
          }}
        >
          👥 Espia como vienen los rivales
        </h2>
      </div>

      {availableRounds.length === 0 && (
        <EmptyState
          icon="🔒"
          title="Todavía no hay partidos para ver"
          description="Los pronósticos de otros usuarios aparecerán cuando exista al menos un partido iniciado."
        />
      )}

      {availableRounds.length > 0 && (
        <div className="card" style={{ marginBottom: 'var(--space-sm)' }}>
          <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
          <RoundUserSelectors
            availableRounds={availableRounds}
            selectedRound={selectedRound}
            onRoundChange={setSelectedRound}
            viewMode={viewMode}
            users={users}
            selectedUser={selectedUser}
            onUserChange={setSelectedUser}
            matches={matches}
            matchesLoading={matchesLoading}
            selectedMatchId={selectedMatchId}
            onMatchChange={setSelectedMatchId}
          />
        </div>
      )}

      {showByUser && (
        <MatchPredictionsByUser
          matches={matches}
          roundPredictions={roundPredictions}
          hasMatchStarted={hasMatchStarted}
          loading={loading}
        />
      )}

      {showByMatch && (
        <MatchPredictionsByMatch
          selectedMatch={selectedMatch}
          users={users}
          matchPredictions={matchPredictions}
          matchLoading={matchLoading}
        />
      )}

      {availableRounds.length > 0 &&
        selectedRound &&
        !matchesLoading &&
        matches.length === 0 &&
        !selectedRoundHasStartedMatches && (
          <EmptyState
            icon="⚽"
            title="No hay partidos cargados"
            description="Esta fecha todavía no tiene partidos configurados"
          />
        )}

      {availableRounds.length > 0 &&
        selectedRound &&
        ((viewMode === 'by-user' && selectedUser) ||
          (viewMode === 'by-match' && selectedMatchId)) &&
        ((viewMode === 'by-user' && !selectedRoundHasStartedMatches) ||
          (viewMode === 'by-match' && !selectedMatchHasStarted)) && (
          <EmptyState
            icon="🔒"
            title="Todavía no comenzó"
            description="Los pronósticos de rivales se muestran cuando el partido ya empezó."
          />
        )}

      {availableRounds.length > 0 && noSelection && (
        <EmptyState
          icon="👥"
          title={
            viewMode === 'by-match'
              ? 'Seleccioná una fecha y un partido'
              : 'Seleccioná una fecha y un usuario'
          }
          description={
            viewMode === 'by-match'
              ? 'Elegí una fecha y un partido para ver todos los pronósticos'
              : 'Elegí una fecha y un usuario para ver sus pronósticos'
          }
        />
      )}
    </div>
  )
}
