import { useRounds } from '../../hooks/useRounds'

export default function RoundManager() {
  const { rounds, activeRound, updateRoundStatus, openNextRound, loading } = useRounds()

  const handleOpenNextRound = async () => {
    if (confirm('¿Cerrar la fecha actual y abrir la siguiente?')) {
      const { error } = await openNextRound()
      if (error) {
        alert('Error: ' + error.message)
      } else {
        alert('✅ Fecha actualizada correctamente!')
      }
    }
  }

  const handleChangeStatus = async (roundNumber, newStatus) => {
    const statusNames = {
      closed: 'Cerrada',
      open: 'Abierta',
      finished: 'Finalizada'
    }

    if (confirm(`¿Cambiar estado de Fecha ${roundNumber} a "${statusNames[newStatus]}"?`)) {
      const { error } = await updateRoundStatus(roundNumber, newStatus)
      if (error) {
        alert('Error: ' + error.message)
      } else {
        alert('✅ Estado actualizado!')
      }
    }
  }

  const getStatusConfig = (status) => {
    const configs = {
      closed: {
        bg: 'rgba(107, 114, 128, 0.1)',
        border: '#9ca3af',
        color: '#4b5563',
        icon: '🔒',
        label: 'Cerrada'
      },
      open: {
        bg: 'rgba(16, 185, 129, 0.1)',
        border: '#10b981',
        color: '#047857',
        icon: '🟢',
        label: 'Abierta'
      },
      finished: {
        bg: 'rgba(59, 130, 246, 0.1)',
        border: '#3b82f6',
        color: '#1e40af',
        icon: '✅',
        label: 'Finalizada'
      }
    }
    return configs[status] || configs.closed
  }

  if (loading) {
    return (
      <div className="container" style={{ maxWidth: '1000px' }}>
        <div className="loading-container" style={{ minHeight: '60vh' }}>
          <div className="loading-content">
            <div className="spinner"></div>
            <p className="loading-text">Cargando fechas...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={{ maxWidth: '1000px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
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
          <span style={{ fontSize: '2rem' }}>📅</span>
          <span>Gestión de Fechas</span>
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
          Administrá el estado de cada fecha del torneo
        </p>
      </div>

      {/* Active Round Card */}
      {activeRound && (
        <div className="card" style={{
          marginBottom: '32px',
          backgroundColor: 'var(--color-surface)',
          border: '3px solid #10b981',
          borderRadius: '16px',
          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.2)',
          position: 'relative',
          overflow: 'hidden',
          padding: '32px 28px'
        }}>
          {/* Barra lateral verde */}
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '8px',
            background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)'
          }} />

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '28px',
            paddingLeft: '16px'
          }}>
            <div style={{ flex: 1, minWidth: '240px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                padding: '8px 18px',
                borderRadius: '12px',
                marginBottom: '16px',
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}>
                <span style={{ fontSize: '1.1rem' }}>🟢</span>
                <span style={{
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  color: '#047857',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px'
                }}>
                  Fecha Activa
                </span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '12px'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  border: '2px solid rgba(16, 185, 129, 0.2)'
                }}>
                  📅
                </div>
                <p style={{
                  fontSize: '2.25rem',
                  fontWeight: '700',
                  color: 'var(--color-text-primary)',
                  margin: 0,
                  lineHeight: 1
                }}>
                  Fecha {activeRound.round_number}
                </p>
              </div>
              <p style={{
                fontSize: '0.95rem',
                color: 'var(--color-text-secondary)',
                margin: 0,
                lineHeight: 1.5,
                paddingLeft: '80px'
              }}>
                Los usuarios pueden cargar sus pronósticos
              </p>
            </div>
            {activeRound.round_number < 16 && (
              <button
                onClick={handleOpenNextRound}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  padding: '16px 32px',
                  borderRadius: '14px',
                  border: 'none',
                  fontWeight: '700',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 6px 16px rgba(16, 185, 129, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  whiteSpace: 'nowrap',
                  minHeight: 'auto'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'
                  e.currentTarget.style.boxShadow = '0 10px 24px rgba(16, 185, 129, 0.45)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)'
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.35)'
                }}
              >
                <span>Abrir Próxima Fecha</span>
                <span style={{ fontSize: '1.4rem', marginLeft: '4px' }}>→</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Rounds List */}
      <div className="card" style={{ padding: '0' }}>
        <div style={{
          padding: '20px 24px',
          borderBottom: '2px solid #E0E0E0',
          backgroundColor: 'var(--color-surface-variant)'
        }}>
          <h3 style={{
            fontSize: '1.1rem',
            fontWeight: '700',
            color: 'var(--color-text-primary)',
            margin: 0
          }}>
            Todas las Fechas
          </h3>
        </div>

        <div style={{ padding: '16px' }}>
          <div style={{
            display: 'grid',
            gap: '12px'
          }}>
            {rounds.map((round) => {
              const statusConfig = getStatusConfig(round.status)
              const isActive = round.status === 'open'

              return (
                <div
                  key={round.id}
                  style={{
                    border: `2px solid ${isActive ? statusConfig.border : '#E0E0E0'}`,
                    borderRadius: '12px',
                    padding: '16px',
                    backgroundColor: isActive ? statusConfig.bg : 'var(--color-surface)',
                    transition: 'all 0.2s',
                    boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.08)' : 'none'
                  }}
                >
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: '16px',
                    alignItems: 'center'
                  }}>
                    {/* Round Info */}
                    <div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '8px',
                        flexWrap: 'wrap'
                      }}>
                        <span style={{
                          fontSize: '1.2rem',
                          fontWeight: '700',
                          color: 'var(--color-text-primary)'
                        }}>
                          Fecha {round.round_number}
                        </span>
                        <span style={{
                          backgroundColor: statusConfig.bg,
                          border: `2px solid ${statusConfig.border}`,
                          color: statusConfig.color,
                          padding: '4px 12px',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <span>{statusConfig.icon}</span>
                          <span>{statusConfig.label}</span>
                        </span>
                      </div>
                      <p style={{
                        fontSize: '0.85rem',
                        color: 'var(--color-text-secondary)',
                        margin: 0
                      }}>
                        {new Date(round.created_at).toLocaleDateString('es-AR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>

                    {/* Status Selector */}
                    <select
                      value={round.status}
                      onChange={(e) => handleChangeStatus(round.round_number, e.target.value)}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '8px',
                        border: '2px solid #E0E0E0',
                        backgroundColor: 'var(--color-surface)',
                        color: 'var(--color-text-primary)',
                        fontWeight: '600',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        outline: 'none',
                        transition: 'all 0.2s',
                        minWidth: '140px'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = 'var(--color-primary)'
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#E0E0E0'
                      }}
                    >
                      <option value="closed">🔒 Cerrada</option>
                      <option value="open">🟢 Abierta</option>
                      <option value="finished">✅ Finalizada</option>
                    </select>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="card" style={{
        marginTop: '24px',
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        border: '2px solid #3b82f6'
      }}>
        <h3 style={{
          fontWeight: '700',
          color: '#1e40af',
          marginBottom: '12px',
          fontSize: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '1.3rem' }}>ℹ️</span>
          <span>Estados de las Fechas</span>
        </h3>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          fontSize: '0.9rem',
          color: '#1e40af'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>🔒</span>
            <strong>Cerrada:</strong>
            <span style={{ color: '#4b5563' }}>No se pueden cargar pronósticos</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>🟢</span>
            <strong>Abierta:</strong>
            <span style={{ color: '#4b5563' }}>Los usuarios pueden cargar pronósticos</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>✅</span>
            <strong>Finalizada:</strong>
            <span style={{ color: '#4b5563' }}>Todos los partidos finalizaron</span>
          </div>
        </div>
      </div>
    </div>
  )
}
