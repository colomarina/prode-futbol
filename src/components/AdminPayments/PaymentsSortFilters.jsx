const FILTER_OPTIONS = [
  { id: 'all', label: 'Todos' },
  { id: 'paid', label: 'Pagos' },
  { id: 'pending', label: 'Pendientes' },
]

const SORT_OPTIONS = [
  { id: 'name_asc', label: 'Nombre A→Z' },
  { id: 'name_desc', label: 'Nombre Z→A' },
  { id: 'paid_first', label: 'Pagos primero' },
  { id: 'pending_first', label: 'Pendientes primero' },
]

export default function PaymentsSortFilters({
  filterStatus,
  onFilterChange,
  sortOrder,
  onSortChange,
  counts,
}) {
  return (
    <div
      style={{
        marginBottom: '12px',
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {FILTER_OPTIONS.map(opt => {
          const isActive = filterStatus === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onFilterChange(opt.id)}
              style={{
                padding: '5px 12px',
                borderRadius: '20px',
                border: '1px solid',
                borderColor: isActive ? 'var(--color-primary)' : 'var(--color-border)',
                background: isActive ? 'var(--color-primary)' : 'var(--color-surface)',
                color: isActive ? '#fff' : 'var(--color-text-secondary)',
                fontSize: '0.8rem',
                fontWeight: isActive ? '600' : '400',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {opt.label} ({counts[opt.id] ?? 0})
            </button>
          )
        })}
      </div>

      <select
        value={sortOrder}
        onChange={e => onSortChange(e.target.value)}
        style={{
          padding: '5px 10px',
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
          color: 'var(--color-text-primary)',
          fontSize: '0.8rem',
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        {SORT_OPTIONS.map(opt => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
