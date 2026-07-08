import { memo } from 'react'
import SelectDropdown from '../../Common/SelectDropdown'
import { getRoundDisplayName } from '../../../utils/roundLabels'

const STANDALONE_TABLE_ROUNDS = [
  { id: 5, round_number: 5, name: 'Octavos de final' },
  { id: 4, round_number: 4, name: '16vos de final' },
]

const LeaderboardHeader = memo(function LeaderboardHeader({
  selectedRound,
  setSelectedRound,
  rounds,
  roundsLoading,
  isWorldCupTournament = false,
}) {
  const playoffRounds = new Set([17, 18, 19, 20])
  const playoffLabel = isWorldCupTournament ? '🥊 Cuartos a Final' : '🥊 Playoffs'
  const standaloneRoundNumbers = new Set(STANDALONE_TABLE_ROUNDS.map(round => round.round_number))
  const roundOptions = [
    { id: null, round_number: null, name: '🏆 General' },
    { id: 'playoffs', round_number: 'playoffs', name: '🥊 Playoffs' },
    ...(isWorldCupTournament ? STANDALONE_TABLE_ROUNDS : []),
    ...rounds
      .filter(r => ['open', 'locked', 'finished'].includes(r.status))
      .filter(r => !playoffRounds.has(r.round_number))
      .filter(r => !standaloneRoundNumbers.has(r.round_number))
      .sort((a, b) => b.round_number - a.round_number)
      .map(r => ({
        ...r,
        id: r.round_number,
      })),
  ]

  const renderRoundLabel = round => {
    if (round.round_number === null) return '🏆 General'
    if (round.round_number === 'playoffs') return playoffLabel
    return `📅 ${getRoundDisplayName(round)}`
  }

  return (
    <div style={{ marginBottom: '16px' }}>
      <h2
        style={{
          fontWeight: '700',
          color: 'var(--color-primary)',
          margin: '0 0 12px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontSize: '1.5rem',
        }}
      >
        <span>🏆</span>
        <span>Tabla de Posiciones</span>
      </h2>

      {rounds && rounds.length > 0 && (
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
