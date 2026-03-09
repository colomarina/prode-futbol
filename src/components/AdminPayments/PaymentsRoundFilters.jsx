import SelectDropdown from '../Common/SelectDropdown'
import PaymentsStatsRow from './PaymentsStatsRow'

export default function PaymentsRoundFilters({
  rounds,
  roundsLoading,
  selectedRound,
  onRoundSelect,
  stats,
}) {
  return (
    <div
      style={{
        marginBottom: '16px',
      }}
    >
      <div
        style={{
          background: 'var(--color-surface)',
          borderRadius: '12px',
          border: '1px solid var(--color-border)',
          padding: '14px',
          marginBottom: '12px',
        }}
      >
        <p style={{ margin: '0 0 6px', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
          Fecha
        </p>
        <SelectDropdown
          items={rounds}
          selectedId={selectedRound}
          onSelect={onRoundSelect}
          disabled={roundsLoading || rounds.length === 0}
          placeholder="Sin fechas"
          valueKey="round_number"
          renderButton={round => <span>Fecha {round.round_number}</span>}
          renderOption={round => <span>Fecha {round.round_number}</span>}
        />
      </div>

      <PaymentsStatsRow stats={stats} />
    </div>
  )
}
