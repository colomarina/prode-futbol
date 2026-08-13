import { memo } from 'react'
import SelectDropdown from '../../Common/SelectDropdown'
import { getRoundDisplayName } from '../../../utils/roundLabels'

/**
 * `rounds` ya viene filtrado y ordenado por `getLeaderboardRounds`: acá no se
 * decide qué fechas tienen tabla propia, solo cómo se etiquetan.
 */
const LeaderboardHeader = memo(function LeaderboardHeader({
  selectedRound,
  setSelectedRound,
  rounds = [],
  roundsLoading,
  showPlayoffs = false,
  isWorldCupTournament = false,
}) {
  const playoffLabel = isWorldCupTournament ? '🥊 Cuartos a Final' : '🥊 Playoffs'
  const roundOptions = [
    { id: null, round_number: null, name: '🏆 General' },
    ...(showPlayoffs ? [{ id: 'playoffs', round_number: 'playoffs', name: playoffLabel }] : []),
    ...rounds,
  ]

  const renderRoundLabel = round => {
    if (round.round_number === null) return '🏆 General'
    if (round.round_number === 'playoffs') return playoffLabel
    return `📅 ${getRoundDisplayName(round)}`
  }

  return (
    <div style={{ marginBottom: 'var(--space-lg)' }}>
      <h2
        style={{
          fontWeight: '700',
          color: 'var(--color-primary-text)',
          margin: '0 0 var(--space-md) 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-sm)',
          fontSize: 'var(--font-size-2xl)',
        }}
      >
        <span>🏆</span>
        <span>Tabla de Posiciones</span>
      </h2>

      {/* Con una sola opción no hay nada que elegir: la General ya está a la vista. */}
      {roundOptions.length > 1 && (
        <SelectDropdown
          items={roundOptions}
          selectedId={selectedRound === null ? null : selectedRound}
          onSelect={value => setSelectedRound(value)}
          valueKey="id"
          isLoading={roundsLoading}
          placeholder="Seleccionar fecha..."
          renderButton={round => (
            <span style={{ fontWeight: '600' }}>{renderRoundLabel(round)}</span>
          )}
          renderOption={round => (
            <span style={{ flex: 1, fontWeight: '600' }}>{renderRoundLabel(round)}</span>
          )}
        />
      )}
    </div>
  )
})

export default LeaderboardHeader
