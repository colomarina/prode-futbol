import { useState, useCallback, useMemo, memo } from 'react'
import { useLeaderboard } from '../../hooks/useLeaderboard'
import { useRounds } from '../../hooks/useRounds'

// Custom Round Select Component
const RoundSelect = memo(function RoundSelect({ value, onChange, rounds, loading }) {
  const [isOpen, setIsOpen] = useState(false)

  const getStatusConfig = useCallback(status => {
    const configs = {
      pending: { icon: '⏳', label: 'Pendiente', color: '#9ca3af' },
      open: { icon: '🟢', label: 'En curso', color: '#10b981' },
      locked: { icon: '⚽', label: 'En juego', color: '#ef4444' },
      finished: { icon: '✅', label: 'Finalizada', color: '#3b82f6' },
    }
    return configs[status] || configs.pending
  }, [])

  const availableRounds = useMemo(
    () => rounds.filter(round => ['locked', 'finished'].includes(round.status)),
    [rounds]
  )

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
        <div
          style={{
            width: '24px',
            height: '24px',
            margin: '0 auto',
            border: '3px solid rgba(30, 127, 67, 0.1)',
            borderTop: '3px solid var(--color-primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
      </div>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
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
          />
          <div
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
            {/* Opción General */}
            <button
              type="button"
              onClick={() => {
                onChange(null)
                setIsOpen(false)
              }}
              style={{
                width: '100%',
                padding: '16px 20px',
                border: 'none',
                backgroundColor: value === null ? 'var(--color-surface-variant)' : 'transparent',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                textAlign: 'left',
                borderBottom: '1px solid #E0E0E0',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
              onMouseEnter={e => {
                if (value !== null) {
                  e.currentTarget.style.backgroundColor = 'var(--color-surface-variant)'
                }
              }}
              onMouseLeave={e => {
                if (value !== null) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }
              }}
            >
              <span style={{ fontSize: '1.8rem' }}>🏆</span>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontWeight: '700',
                    fontSize: '0.95rem',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  Tabla General
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                  Todas las fechas del torneo
                </div>
              </div>
            </button>

            {/* Opciones de fechas - Solo fechas bloqueadas o finalizadas */}
            {availableRounds.map(round => {
              const statusConfig = getStatusConfig(round.status)

              return (
                <button
                  key={round.round_number}
                  type="button"
                  onClick={() => {
                    onChange(round.round_number)
                    setIsOpen(false)
                  }}
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    border: 'none',
                    backgroundColor:
                      value === round.round_number ? 'var(--color-surface-variant)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    textAlign: 'left',
                    borderBottom: '1px solid #E0E0E0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                  onMouseEnter={e => {
                    if (value !== round.round_number) {
                      e.currentTarget.style.backgroundColor = 'var(--color-surface-variant)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (value !== round.round_number) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  <span style={{ fontSize: '1.8rem' }}>📆</span>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontWeight: '700',
                        fontSize: '0.95rem',
                        color: 'var(--color-text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span>
                        Fecha
                        {round.round_number}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '0.8rem',
                        color: statusConfig.color,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: '600',
                      }}
                    >
                      <span>{statusConfig.icon}</span>
                      <span>{statusConfig.label}</span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
})

export default function Leaderboard() {
  const [selectedRound, setSelectedRound] = useState(null) // null = general
  const { leaderboard, loading, error } = useLeaderboard(selectedRound)
  const { rounds, loading: roundsLoading } = useRounds()

  if (loading) {
    return (
      <div
        className="container"
        style={{ maxWidth: '1000px', textAlign: 'center', padding: '48px 16px' }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            margin: '0 auto 20px',
            border: '4px solid rgba(30, 127, 67, 0.1)',
            borderTop: '4px solid var(--color-primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <p
          style={{
            color: 'var(--color-text-secondary)',
            fontSize: '1rem',
            fontWeight: '500',
          }}
        >
          Cargando tabla de posiciones...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container" style={{ maxWidth: '1000px' }}>
        <div className="alert alert-error">⚠️ Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="container" style={{ maxWidth: '1000px', overflow: 'hidden' }}>
      {/* Header compacto con selector integrado */}
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

        {/* Selector compacto */}
        <RoundSelect
          value={selectedRound}
          onChange={setSelectedRound}
          rounds={rounds}
          loading={roundsLoading}
        />
      </div>

      {/* Tabla */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {leaderboard.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📊</div>
            <p
              style={{
                fontSize: '1rem',
                color: 'var(--color-text-primary)',
                marginBottom: '4px',
                fontWeight: '600',
              }}
            >
              No hay datos disponibles
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              Los puntos se calculan al cargar resultados
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: 'var(--color-surface-variant)',
                    borderBottom: '2px solid #E0E0E0',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                  }}
                >
                  <th
                    style={{
                      padding: '12px 8px',
                      textAlign: 'left',
                      fontSize: '0.7rem',
                      fontWeight: '700',
                      color: 'var(--color-text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Pos
                  </th>
                  <th
                    style={{
                      padding: '12px 8px',
                      textAlign: 'left',
                      fontSize: '0.7rem',
                      fontWeight: '700',
                      color: 'var(--color-text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Jugador
                  </th>
                  <th
                    style={{
                      padding: '12px 8px',
                      textAlign: 'center',
                      fontSize: '0.7rem',
                      fontWeight: '700',
                      color: 'var(--color-text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Pts
                  </th>
                  {!selectedRound && (
                    <th
                      style={{
                        padding: '12px 8px',
                        textAlign: 'center',
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        color: 'var(--color-text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Fch
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((player, index) => {
                  const position = index + 1
                  let positionEmoji = ''
                  let rowBgColor = 'transparent'

                  if (position === 1) {
                    positionEmoji = '🥇'
                    rowBgColor = 'rgba(249, 168, 37, 0.1)'
                  } else if (position === 2) {
                    positionEmoji = '🥈'
                    rowBgColor = 'rgba(189, 189, 189, 0.1)'
                  } else if (position === 3) {
                    positionEmoji = '🥉'
                    rowBgColor = 'rgba(205, 127, 50, 0.1)'
                  }

                  return (
                    <tr
                      key={player.id}
                      style={{
                        backgroundColor: rowBgColor,
                        borderBottom: '1px solid #E0E0E0',
                        transition: 'background-color 0.2s',
                      }}
                    >
                      <td
                        style={{
                          padding: '12px 8px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          {positionEmoji && (
                            <span style={{ fontSize: '1.3rem' }}>{positionEmoji}</span>
                          )}
                          <span
                            style={{
                              fontSize: '1rem',
                              fontWeight: '700',
                              color: 'var(--color-text-primary)',
                            }}
                          >
                            {position}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <div>
                          <div
                            style={{
                              fontSize: '0.9rem',
                              fontWeight: '600',
                              color: 'var(--color-text-primary)',
                              marginBottom: '2px',
                              textTransform: 'capitalize',
                            }}
                          >
                            {player.username}
                          </div>
                          <div
                            style={{
                              fontSize: '0.8rem',
                              color: 'var(--color-text-secondary)',
                              textTransform: 'capitalize',
                            }}
                          >
                            {player.full_name}
                          </div>
                        </div>
                      </td>
                      <td
                        style={{
                          padding: '12px 8px',
                          textAlign: 'center',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '1.3rem',
                            fontWeight: '700',
                            color: 'var(--color-primary)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          {player.total_points}
                          <span style={{ fontSize: '0.85rem' }}>pts</span>
                        </span>
                      </td>
                      {!selectedRound && (
                        <td
                          style={{
                            padding: '12px 8px',
                            textAlign: 'center',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.85rem',
                              color: 'var(--color-text-secondary)',
                              fontWeight: '600',
                            }}
                          >
                            {player.rounds_played || 0}
                          </span>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
