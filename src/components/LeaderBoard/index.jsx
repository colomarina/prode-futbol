import { useState } from 'react'
import { useLeaderboard } from '../../hooks/useLeaderboard'
import { useMatches } from '../../hooks/useMatches'

export default function Leaderboard() {
  const [selectedRound, setSelectedRound] = useState(null) // null = general
  const { leaderboard, loading, error } = useLeaderboard(selectedRound)
  const { matches } = useMatches()

  // Obtener números de fechas únicas
  const rounds = [...new Set(matches.map(m => m.round_number))].sort((a, b) => b - a)

  if (loading) {
    return (
      <div className="container" style={{ maxWidth: '1000px' }}>
        <div className="loading-container" style={{ minHeight: '60vh' }}>
          <div className="loading-content">
            <div className="spinner"></div>
            <p className="loading-text">Cargando tabla de posiciones...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container" style={{ maxWidth: '1000px' }}>
        <div className="alert alert-error">
          ⚠️ Error: {error}
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={{ maxWidth: '1000px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <h2 style={{
          fontSize: '1.75rem',
          fontWeight: '700',
          color: 'var(--color-primary)',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '2.5rem' }}>🏆</span>
          <span>Tabla de Posiciones</span>
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
          {selectedRound === null
            ? 'Clasificación general del torneo'
            : `Resultados de la Fecha ${selectedRound}`}
        </p>
      </div>

      {/* Selector de fecha */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: 'var(--color-text-primary)',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          📅 Filtrar por fecha
        </h3>
        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setSelectedRound(null)}
            className={selectedRound === null ? 'btn-primary' : 'btn-outline'}
            style={{
              padding: '10px 20px',
              fontSize: '0.9rem'
            }}
          >
            🏆 General
          </button>
          {rounds.map((round) => (
            <button
              key={round}
              onClick={() => setSelectedRound(round)}
              className={selectedRound === round ? 'btn-primary' : 'btn-outline'}
              style={{
                padding: '10px 20px',
                fontSize: '0.9rem'
              }}
            >
              Fecha {round}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {leaderboard.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>📊</div>
            <p style={{
              fontSize: '1.1rem',
              color: 'var(--color-text-primary)',
              marginBottom: '8px',
              fontWeight: '600'
            }}>
              Todavía no hay datos para mostrar
            </p>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
              Los puntos se calculan automáticamente cuando se cargan los resultados
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{
                  backgroundColor: 'var(--color-surface-variant)',
                  borderBottom: '2px solid #E0E0E0'
                }}>
                  <th style={{
                    padding: '16px 12px',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    color: 'var(--color-text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Pos
                  </th>
                  <th style={{
                    padding: '16px 12px',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    color: 'var(--color-text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Jugador
                  </th>
                  <th style={{
                    padding: '16px 12px',
                    textAlign: 'center',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    color: 'var(--color-text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Puntos
                  </th>
                  {!selectedRound && (
                    <th style={{
                      padding: '16px 12px',
                      textAlign: 'center',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      color: 'var(--color-text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
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
                        transition: 'background-color 0.2s'
                      }}
                    >
                      <td style={{
                        padding: '16px 12px',
                        whiteSpace: 'nowrap'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          {positionEmoji && (
                            <span style={{ fontSize: '1.5rem' }}>{positionEmoji}</span>
                          )}
                          <span style={{
                            fontSize: '1.1rem',
                            fontWeight: '700',
                            color: 'var(--color-text-primary)'
                          }}>
                            {position}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 12px' }}>
                        <div>
                          <div style={{
                            fontSize: '0.95rem',
                            fontWeight: '600',
                            color: 'var(--color-text-primary)',
                            marginBottom: '2px'
                          }}>
                            {player.full_name}
                          </div>
                          <div style={{
                            fontSize: '0.85rem',
                            color: 'var(--color-text-secondary)'
                          }}>
                            @{player.username}
                          </div>
                        </div>
                      </td>
                      <td style={{
                        padding: '16px 12px',
                        textAlign: 'center'
                      }}>
                        <span style={{
                          fontSize: '1.5rem',
                          fontWeight: '700',
                          color: 'var(--color-primary)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {player.total_points}
                          <span style={{ fontSize: '1rem' }}>pts</span>
                        </span>
                      </td>
                      {!selectedRound && (
                        <td style={{
                          padding: '16px 12px',
                          textAlign: 'center'
                        }}>
                          <span style={{
                            fontSize: '0.9rem',
                            color: 'var(--color-text-secondary)',
                            fontWeight: '600'
                          }}>
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
      <div className="card" style={{
        marginTop: '24px',
        backgroundColor: 'rgba(30, 127, 67, 0.05)',
        border: '2px solid var(--color-primary)'
      }}>
        <h3 style={{
          fontWeight: '700',
          color: 'var(--color-primary)',
          marginBottom: '16px',
          fontSize: '1.1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          📊 Sistema de Puntos
        </h3>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px',
            backgroundColor: 'var(--color-surface)',
            borderRadius: '8px'
          }}>
            <span style={{
              fontSize: '2rem',
              minWidth: '40px',
              textAlign: 'center'
            }}>🎯</span>
            <div>
              <strong style={{ color: 'var(--color-text-primary)' }}>Resultado exacto:</strong>
              <span style={{
                marginLeft: '8px',
                color: 'var(--color-success)',
                fontWeight: '700',
                fontSize: '1.1rem'
              }}>5 puntos</span>
            </div>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px',
            backgroundColor: 'var(--color-surface)',
            borderRadius: '8px'
          }}>
            <span style={{
              fontSize: '2rem',
              minWidth: '40px',
              textAlign: 'center'
            }}>📈</span>
            <div>
              <strong style={{ color: 'var(--color-text-primary)' }}>Diferencia de goles exacta:</strong>
              <span style={{
                marginLeft: '8px',
                color: 'var(--color-success)',
                fontWeight: '700',
                fontSize: '1.1rem'
              }}>3 puntos</span>
            </div>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px',
            backgroundColor: 'var(--color-surface)',
            borderRadius: '8px'
          }}>
            <span style={{
              fontSize: '2rem',
              minWidth: '40px',
              textAlign: 'center'
            }}>✅</span>
            <div>
              <strong style={{ color: 'var(--color-text-primary)' }}>Ganador correcto (o empate):</strong>
              <span style={{
                marginLeft: '8px',
                color: 'var(--color-success)',
                fontWeight: '700',
                fontSize: '1.1rem'
              }}>1 punto</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
