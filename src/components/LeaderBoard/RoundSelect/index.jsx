import { useState, useCallback, useMemo, memo } from 'react'
import { ROUND_STATUS_CONFIG } from '../leaderboard.config'
import LoadingSpinner from '../LoadingSpinner'

const RoundSelect = memo(function RoundSelect({ value, onChange, rounds, loading }) {
  const [isOpen, setIsOpen] = useState(false)

  const availableRounds = useMemo(
    () => rounds.filter(round => ['locked', 'finished'].includes(round.status)),
    [rounds]
  )

  const getStatusConfig = useCallback(
    status => ROUND_STATUS_CONFIG[status] || ROUND_STATUS_CONFIG.pending,
    []
  )

  const handleSelect = useCallback(
    roundNumber => {
      onChange(roundNumber)
      setIsOpen(false)
    },
    [onChange]
  )

  const handleToggle = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  if (loading) {
    return (
      <div
        style={{
          padding: '16px',
          textAlign: 'center',
          backgroundColor: 'var(--color-surface-variant)',
          borderRadius: '12px',
          border: '2px solid #E0E0E0',
        }}
      >
        <LoadingSpinner size="sm" label="" />
      </div>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={handleToggle}
        style={{
          width: '100%',
          padding: '8px 12px',
          borderRadius: '8px',
          border: '1.5px solid var(--color-primary)',
          backgroundColor: 'var(--color-surface)',
          cursor: 'pointer',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          fontSize: '0.85rem',
          fontWeight: '600',
          color: 'var(--color-text-primary)',
        }}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {value === null ? '🏆 General' : `📅 Fecha ${value}`}
        <span
          style={{
            fontSize: '0.7rem',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        >
          ▼
        </span>
      </button>

      {isOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 10,
            }}
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div
            role="listbox"
            aria-label="Seleccionar fecha"
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              width: '100%',
              backgroundColor: 'var(--color-surface)',
              border: '2px solid var(--color-primary)',
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              maxHeight: '400px',
              overflowY: 'auto',
              zIndex: 20,
            }}
          >
            <RoundOption
              value={null}
              currentValue={value}
              label="Tabla General"
              description="Todas las fechas del torneo"
              icon="🏆"
              onSelect={handleSelect}
            />

            {availableRounds.map(round => {
              const statusConfig = getStatusConfig(round.status)

              return (
                <RoundOption
                  key={round.round_number}
                  value={round.round_number}
                  currentValue={value}
                  label={`Fecha ${round.round_number}`}
                  description={statusConfig.label}
                  icon="📆"
                  statusConfig={statusConfig}
                  onSelect={handleSelect}
                />
              )
            })}
          </div>
        </>
      )}
    </div>
  )
})

const RoundOption = memo(function RoundOption({
  value,
  currentValue,
  label,
  description,
  icon,
  statusConfig,
  onSelect,
}) {
  const isSelected = currentValue === value
  const [isHovered, setIsHovered] = useState(false)

  const handleClick = useCallback(() => {
    onSelect(value)
  }, [onSelect, value])

  const backgroundColor = isSelected
    ? 'var(--color-surface-variant)'
    : isHovered
      ? 'var(--color-surface-variant)'
      : 'transparent'

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '100%',
        padding: '16px 20px',
        border: 'none',
        backgroundColor,
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        textAlign: 'left',
        borderBottom: '1px solid #E0E0E0',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
      role="option"
      aria-selected={isSelected}
    >
      <span style={{ fontSize: '1.8rem' }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontWeight: '700',
            fontSize: '0.95rem',
            color: 'var(--color-text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: statusConfig ? '8px' : 0,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: '0.8rem',
            color: statusConfig?.color || 'var(--color-text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: statusConfig ? '600' : '400',
          }}
        >
          {statusConfig && <span>{statusConfig.icon}</span>}
          <span>{description}</span>
        </div>
      </div>
    </button>
  )
})

export default RoundSelect
