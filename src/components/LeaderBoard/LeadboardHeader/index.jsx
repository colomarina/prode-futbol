import { memo } from 'react'
import RoundSelect from '../RoundSelect'

const LeaderboardHeader = memo(function LeaderboardHeader({
  selectedRound,
  setSelectedRound,
  rounds,
  roundsLoading,
}) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <h2
        style={{
          fontWeight: '700',
          color: 'var(--color-primary)',
          margin: 0,
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
      <p
        style={{
          color: 'var(--color-text-secondary)',
          fontSize: '0.85rem',
          margin: '4px 0 12px 0',
          textAlign: 'center',
        }}
      >
        {selectedRound === null ? 'Clasificación general' : `Fecha ${selectedRound}`}
      </p>

      <RoundSelect
        value={selectedRound}
        onChange={setSelectedRound}
        rounds={rounds}
        loading={roundsLoading}
      />
    </div>
  )
})

export default LeaderboardHeader
