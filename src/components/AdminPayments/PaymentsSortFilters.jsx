import SelectDropdown from '../Common/SelectDropdown'

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
  const filterItems = FILTER_OPTIONS.map(option => ({
    ...option,
    count: counts[option.id] ?? 0,
  }))

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
      <div style={{ minWidth: '220px', flex: '1 1 240px' }}>
        <p style={{ margin: '0 0 6px', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
          Estado
        </p>
        <SelectDropdown
          items={filterItems}
          selectedId={filterStatus}
          onSelect={onFilterChange}
          placeholder="Filtrar por estado"
          renderButton={option => (
            <span>
              {option.label} ({option.count})
            </span>
          )}
          renderOption={option => (
            <span>
              {option.label} ({option.count})
            </span>
          )}
        />
      </div>

      <div style={{ minWidth: '220px', flex: '1 1 240px' }}>
        <p style={{ margin: '0 0 6px', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
          Orden
        </p>
        <SelectDropdown
          items={SORT_OPTIONS}
          selectedId={sortOrder}
          onSelect={onSortChange}
          placeholder="Ordenar"
          renderButton={option => <span>{option.label}</span>}
          renderOption={option => <span>{option.label}</span>}
        />
      </div>
    </div>
  )
}
