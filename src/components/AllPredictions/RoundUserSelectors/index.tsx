import { useEffect } from 'react'
import MatchSelector from '../MatchSelector'
import SelectDropdown from '../../Common/SelectDropdown'
import { getRoundDisplayName } from '../../../utils/roundLabels'
import type { MatchWithTeams, Round, Uuid } from '../../../types/domain'
import type { AllPredictionsViewMode, PredictionsUser } from '../../../hooks/useAllPredictions'

interface RoundUserSelectorsProps {
  availableRounds: Round[]
  selectedRound: number | null
  onRoundChange: (roundNumber: number | null) => void
  viewMode: AllPredictionsViewMode
  users: PredictionsUser[]
  selectedUser: Uuid | ''
  onUserChange: (userId: Uuid | '') => void
  matches: MatchWithTeams[]
  matchesLoading?: boolean
  selectedMatchId: Uuid | null
  onMatchChange: (matchId: Uuid | null) => void
}

const RoundUserSelectors = ({
  availableRounds,
  selectedRound,
  onRoundChange,
  viewMode,
  users,
  selectedUser,
  onUserChange,
  matches,
  matchesLoading,
  selectedMatchId,
  onMatchChange,
}: RoundUserSelectorsProps) => {
  // Seleccionar automáticamente la última fecha si no hay seleccionada
  useEffect(() => {
    if (!selectedRound && availableRounds.length > 0) {
      const closestRound = availableRounds.reduce((current, round) =>
        Number(round.round_number) < Number(current.round_number) ? round : current
      )
      onRoundChange(closestRound.round_number)
    }
  }, [availableRounds, selectedRound, onRoundChange])

  // Seleccionar automáticamente el primer partido cuando se cambia a vista por partido
  useEffect(() => {
    if (viewMode === 'by-match' && matches.length > 0 && !selectedMatchId) {
      onMatchChange(matches[0].id)
    }
  }, [viewMode, matches, selectedMatchId, onMatchChange])

  // Cuando cambia la fecha en vista "por partido", seleccionar el primer partido nuevamente
  useEffect(() => {
    if (viewMode === 'by-match' && selectedRound && matches.length > 0) {
      onMatchChange(matches[0].id)
    }
  }, [selectedRound, viewMode, matches, onMatchChange])

  // Limpiar usuario seleccionado cuando se cambia a vista "por usuario"
  useEffect(() => {
    if (viewMode === 'by-user' && selectedUser) {
      // El usuario se mantiene automáticamente, no necesita limpieza
    }
  }, [viewMode, selectedUser])

  // Limpiar match seleccionado cuando se cambia a vista "por usuario"
  useEffect(() => {
    if (viewMode === 'by-user') {
      onMatchChange(null)
    }
  }, [viewMode, onMatchChange])

  const getRoundLabel = (round: Round): string => {
    return `${getRoundDisplayName(round)} ${round.status === 'finished' ? '🏁' : '⚽'}`
  }

  return (
    <>
      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-lg)' }}
        className="responsive-selectors"
      >
        <div>
          <SelectDropdown
            label="📅 Seleccioná una Fecha"
            items={availableRounds}
            selectedId={selectedRound}
            onSelect={onRoundChange}
            valueKey="round_number"
            placeholder="Seleccionar fecha..."
            renderButton={round => (
              <span style={{ fontWeight: '600' }}>{getRoundLabel(round)}</span>
            )}
            renderOption={round => (
              <span style={{ flex: 1, fontWeight: '600' }}>{getRoundLabel(round)}</span>
            )}
          />
        </div>

        {viewMode === 'by-user' ? (
          <div>
            <SelectDropdown
              label="👤 Seleccionar Usuario"
              items={users}
              selectedId={selectedUser}
              onSelect={onUserChange}
              disabled={!selectedRound}
              placeholder="Seleccionar usuario..."
              renderButton={user => (
                <span style={{ fontWeight: '600' }}>
                  {user.full_name} (@{user.username})
                </span>
              )}
              renderOption={user => (
                <span style={{ flex: 1, fontWeight: '600' }}>
                  {user.full_name} (@{user.username})
                </span>
              )}
            />
          </div>
        ) : (
          <div>
            <MatchSelector
              matches={matches}
              selectedMatchId={selectedMatchId}
              onMatchChange={onMatchChange}
              disabled={!selectedRound || matchesLoading || matches.length === 0}
              isLoading={matchesLoading}
            />
          </div>
        )}
      </div>
    </>
  )
}

export default RoundUserSelectors
