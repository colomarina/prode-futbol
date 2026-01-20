import { useState } from 'react'
import { useLeaderboard } from '../../hooks/useLeaderboard'
import { useRounds } from '../../hooks/useRounds'

// Custom Round Select Component
function RoundSelect({ value, onChange, rounds, loading }) {
  const [isOpen, setIsOpen] = useState(false)

  const getStatusConfig = status => {
    const configs = {
      pending: { icon: '⏳', label: 'Pendiente', color: '#9ca3af' },
      open: { icon: '🟢', label: 'En curso', color: '#10b981' },
      locked: { icon: '⚽', label: 'En juego', color: '#ef4444' },
      finished: { icon: '✅', label: 'Finalizada', color: '#3b82f6' },
    }
    return configs[status] || configs.pending
  }

  const selectedRound =
    value === null
      ? { label: '🏆 Tabla General', subtitle: 'Todas las fechas' }
      : rounds.find(r => r.round_number === value)

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
        <div className="spinner" style={{ width: '24px', height: '24px', margin: '0 auto' }} />
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
          padding: '16px 20px',
          borderRadius: '12px',
          border: '2px solid var(--color-primary)',
          backgroundColor: 'var(--color-surface)',
          cursor: 'pointer',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {value === null ? (
            <>
              <span style={{ fontSize: '1.8rem' }}>🏆</span>
              <div style={{ textAlign: 'left' }}>
                <div
                  style={{
                    fontWeight: '700',
                    fontSize: '1rem',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  Tabla General
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                  Todas las fechas
                </div>
              </div>
            </>
          ) : selectedRound ? (
            <>
              <span style={{ fontSize: '1.8rem' }}>📆</span>
              <div style={{ textAlign: 'left' }}>
                <div
                  style={{
                    fontWeight: '700',
                    fontSize: '1rem',
                    color: 'var(--color-text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span>
                    Fecha
                    {selectedRound.round_number}
                  </span>
                  <span style={{ fontSize: '1.2rem' }}>
                    {getStatusConfig(selectedRound.status).icon}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                  {getStatusConfig(selectedRound.status).label}
                </div>
              </div>
            </>
          ) : null}
        </div>
        <span
          style={{
            fontSize: '1.2rem',
            color: 'var(--color-text-secondary)',
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
              right: 0,
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
            {rounds
              .filter(round => ['locked', 'finished'].includes(round.status))
              .map(round => {
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
                        value === round.round_number
                          ? 'var(--color-surface-variant)'
                          : 'transparent',
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
}

export default function Leaderboard() {
  const [selectedRound, setSelectedRound] = useState(null) // null = general
  const { leaderboard, loading, error } = useLeaderboard(selectedRound)
  const { rounds, loading: roundsLoading } = useRounds()

  if (loading) {
    return (
      <div className="container" style={{ maxWidth: '1000px' }}>
        <div className="loading-container" style={{ minHeight: '60vh' }}>
          <div className="loading-content">
            <div className="spinner" />
            <p className="loading-text">Cargando tabla de posiciones...</p>
          </div>
        </div>
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
    <div className="container" style={{ maxWidth: '1000px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <h2
          style={{
            // fontSize: '1.75rem',
            fontWeight: '700',
            color: 'var(--color-primary)',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <span> 🏆Tabla de Posiciones</span>
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
          {selectedRound === null
            ? 'Clasificación general del torneo'
            : `Resultados de la Fecha ${selectedRound}`}
        </p>
      </div>

      {/* Selector de fecha */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3
          style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: 'var(--color-text-primary)',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          📅 Filtrar por fecha
        </h3>
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
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>📊</div>
            <p
              style={{
                fontSize: '1.1rem',
                color: 'var(--color-text-primary)',
                marginBottom: '8px',
                fontWeight: '600',
              }}
            >
              Todavía no hay datos para mostrar
            </p>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
              Los puntos se calculan automáticamente cuando se cargan los resultados
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
                  }}
                >
                  <th
                    style={{
                      padding: '16px 12px',
                      textAlign: 'left',
                      fontSize: '0.75rem',
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
                      padding: '16px 12px',
                      textAlign: 'left',
                      fontSize: '0.75rem',
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
                      padding: '16px 12px',
                      textAlign: 'center',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      color: 'var(--color-text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Puntos
                  </th>
                  {!selectedRound && (
                    <th
                      style={{
                        padding: '16px 12px',
                        textAlign: 'center',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        color: 'var(--color-text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Fechas
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
                          padding: '16px 12px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          {positionEmoji && (
                            <span style={{ fontSize: '1.5rem' }}>{positionEmoji}</span>
                          )}
                          <span
                            style={{
                              fontSize: '1.1rem',
                              fontWeight: '700',
                              color: 'var(--color-text-primary)',
                            }}
                          >
                            {position}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 12px' }}>
                        <div>
                          <div
                            style={{
                              fontSize: '0.95rem',
                              fontWeight: '600',
                              color: 'var(--color-text-primary)',
                              marginBottom: '2px',
                            }}
                          >
                            {player.full_name}
                          </div>
                          <div
                            style={{
                              fontSize: '0.85rem',
                              color: 'var(--color-text-secondary)',
                            }}
                          >
                            @{player.username}
                          </div>
                        </div>
                      </td>
                      <td
                        style={{
                          padding: '16px 12px',
                          textAlign: 'center',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '1.5rem',
                            fontWeight: '700',
                            color: 'var(--color-primary)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          {player.total_points}
                          <span style={{ fontSize: '1rem' }}>pts</span>
                        </span>
                      </td>
                      {!selectedRound && (
                        <td
                          style={{
                            padding: '16px 12px',
                            textAlign: 'center',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.9rem',
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

      {/* Leyenda del sistema de puntos */}
      <div
        className="card"
        style={{
          marginTop: '24px',
          backgroundColor: 'rgba(30, 127, 67, 0.05)',
          border: '2px solid var(--color-primary)',
        }}
      >
        <h3
          style={{
            fontWeight: '700',
            color: 'var(--color-primary)',
            marginBottom: '16px',
            fontSize: '1.1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          📊 Sistema de Puntos
        </h3>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div
            style={{
              padding: '12px',
              backgroundColor: 'var(--color-surface)',
              borderRadius: '8px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '8px',
              }}
            >
              <span
                style={{
                  fontSize: '2rem',
                  minWidth: '40px',
                  textAlign: 'center',
                }}
              >
                🎯
              </span>
              <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.95rem' }}>
                PLENO (resultado exacto):
              </strong>
            </div>
            <div
              style={{
                marginLeft: '52px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                fontSize: '0.9rem',
                color: 'var(--color-text-secondary)',
              }}
            >
              <div>
                • Más de 2 goles:{' '}
                <span
                  style={{
                    color: 'var(--color-success)',
                    fontWeight: '700',
                  }}
                >
                  2 + cantidad de goles
                </span>
              </div>
              <div>
                • 2 o menos goles:{' '}
                <span
                  style={{
                    color: 'var(--color-success)',
                    fontWeight: '700',
                  }}
                >
                  2 puntos
                </span>
              </div>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              backgroundColor: 'var(--color-surface)',
              borderRadius: '8px',
            }}
          >
            <span
              style={{
                fontSize: '2rem',
                minWidth: '40px',
                textAlign: 'center',
              }}
            >
              ✅
            </span>
            <div>
              <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.95rem' }}>
                Partidos de hasta 2 goles (acertar ganador/empate):
              </strong>
              <span
                style={{
                  marginLeft: '8px',
                  color: 'var(--color-success)',
                  fontWeight: '700',
                  fontSize: '1.1rem',
                }}
              >
                1 punto
              </span>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              backgroundColor: 'var(--color-surface)',
              borderRadius: '8px',
            }}
          >
            <span
              style={{
                fontSize: '2rem',
                minWidth: '40px',
                textAlign: 'center',
              }}
            >
              📈
            </span>
            <div>
              <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.95rem' }}>
                Más de 3 goles predichos (acertar cantidad total):
              </strong>
              <span
                style={{
                  marginLeft: '8px',
                  color: 'var(--color-success)',
                  fontWeight: '700',
                  fontSize: '1.1rem',
                }}
              >
                1 punto
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
