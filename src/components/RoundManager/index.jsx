import { useState, useEffect } from 'react'
import { useRounds } from '../../hooks/useRounds'
import { supabase } from '../../lib/supabase'
import Toast from '../Toast'

export default function RoundManager() {
  const { rounds, activeRound, updateRoundStatus, lockRound, finishRound, loading } = useRounds()
  const [matchesByRound, setMatchesByRound] = useState({})
  const [roundNumber, setRoundNumber] = useState(1)
  const [adminLoading, setAdminLoading] = useState(false)
  const [toast, setToast] = useState(null)

  // Cargar información de partidos para cada fecha
  useEffect(() => {
    const fetchMatchesInfo = async () => {
      if (!rounds || rounds.length === 0) return

      try {
        const { data: matches, error } = await supabase
          .from('matches')
          .select('id, round_number, is_finished')
          .order('round_number', { ascending: true })

        if (error) throw error

        // Organizar partidos por fecha
        const matchesMap = {}
        matches?.forEach(match => {
          if (!matchesMap[match.round_number]) {
            matchesMap[match.round_number] = {
              total: 0,
              finished: 0,
            }
          }
          matchesMap[match.round_number].total += 1
          if (match.is_finished) {
            matchesMap[match.round_number].finished += 1
          }
        })

        setMatchesByRound(matchesMap)
      } catch (error) {
        console.error('Error cargando información de partidos:', error)
      }
    }

    fetchMatchesInfo()
  }, [rounds])

  // Funciones administrativas
  const callRpcFunction = async (functionName, params) => {
    setAdminLoading(true)

    try {
      const { data, error } = await supabase.rpc(functionName, params)

      if (error) throw error

      setToast({
        message: data.message || 'Operación completada',
        type: 'success',
      })
    } catch (error) {
      console.error('Error:', error)
      setToast({
        message: `Error: ${error.message}`,
        type: 'error',
      })
    } finally {
      setAdminLoading(false)
    }
  }

  const handleRecalculate = () => {
    if (confirm(`¿Recalcular puntos de la Fecha ${roundNumber}?`)) {
      callRpcFunction('recalculate_round', { round_num: roundNumber })
    }
  }

  const handleReset = () => {
    if (
      confirm(
        `⚠️ ¿RESETEAR COMPLETAMENTE la Fecha ${roundNumber}?\n\nEsto eliminará:\n• Puntos de round_scores\n• Reseteará predicciones\n• Limpiará resultados de partidos`
      )
    ) {
      callRpcFunction('reset_round', { round_num: roundNumber })
    }
  }

  const handleForceFinish = () => {
    if (
      confirm(
        `¿Forzar finalización de Fecha ${roundNumber}?\n\nLos partidos sin resultado pasarán a 0-0`
      )
    ) {
      callRpcFunction('force_finish_round', { round_num: roundNumber })
    }
  }

  const handleLockRound = async () => {
    if (!activeRound) {
      setToast({
        message: 'No hay fecha activa para bloquear',
        type: 'warning',
      })
      return
    }
    if (
      confirm(
        `¿Bloquear la Fecha ${activeRound.round_number}? Los usuarios no podrán editar sus pronósticos.`
      )
    ) {
      const { error } = await lockRound(activeRound.round_number)
      if (error) {
        setToast({
          message: `Error: ${error.message}`,
          type: 'error',
        })
      } else {
        setToast({
          message: 'Fecha bloqueada correctamente',
          type: 'success',
        })
      }
    }
  }

  const handleFinishRound = async roundNumber => {
    // Validar que todos los partidos estén finalizados
    const matchInfo = matchesByRound[roundNumber]

    if (!matchInfo || matchInfo.total === 0) {
      setToast({
        message: 'Esta fecha no tiene partidos cargados',
        type: 'warning',
      })
      return
    }

    if (matchInfo.finished < matchInfo.total) {
      setToast({
        message: `No se puede finalizar. Partidos finalizados: ${matchInfo.finished}/${matchInfo.total}`,
        type: 'warning',
      })
      return
    }

    if (confirm(`¿Finalizar la Fecha ${roundNumber}? Se calcularán los puntajes.`)) {
      const { error } = await finishRound(roundNumber)
      if (error) {
        setToast({
          message: `Error: ${error.message}`,
          type: 'error',
        })
      } else {
        setToast({
          message: 'Fecha finalizada correctamente',
          type: 'success',
        })
      }
    }
  }

  const handleChangeStatus = async (roundNumber, newStatus, currentStatus, roundId) => {
    // Prevenir modificación de fechas finalizadas
    if (currentStatus === 'finished') {
      setToast({
        message: 'No se puede modificar una fecha finalizada',
        type: 'error',
      })
      return
    }

    // Prevenir abrir una fecha si ya hay otra abierta
    if (newStatus === 'open') {
      const openRound = rounds.find(r => r.status === 'open' && r.id !== roundId)
      if (openRound) {
        setToast({
          message: `Ya hay una fecha abierta (Fecha ${openRound.round_number}). Bloqueala o finalizala antes.`,
          type: 'error',
        })
        return
      }
    }

    const statusNames = {
      pending: 'Pendiente',
      open: 'Abierta',
      locked: 'Bloqueada',
      finished: 'Finalizada',
    }

    if (confirm(`¿Cambiar estado de Fecha ${roundNumber} a "${statusNames[newStatus]}"?`)) {
      const { error } = await updateRoundStatus(roundNumber, newStatus)
      if (error) {
        setToast({
          message: `Error: ${error.message}`,
          type: 'error',
        })
      } else {
        setToast({
          message: 'Estado actualizado',
          type: 'success',
        })
      }
    }
  }

  const getStatusConfig = status => {
    const configs = {
      pending: {
        bg: 'rgba(156, 163, 175, 0.1)',
        border: '#9ca3af',
        color: '#6b7280',
        icon: '⏳',
        label: 'Pendiente',
      },
      open: {
        bg: 'rgba(16, 185, 129, 0.1)',
        border: '#10b981',
        color: '#047857',
        icon: '🟢',
        label: 'Abierta',
      },
      locked: {
        bg: 'rgba(239, 68, 68, 0.1)',
        border: '#ef4444',
        color: '#b91c1c',
        icon: '🔒',
        label: 'Bloqueada',
      },
      finished: {
        bg: 'rgba(59, 130, 246, 0.1)',
        border: '#3b82f6',
        color: '#1e40af',
        icon: '✅',
        label: 'Finalizada',
      },
    }
    return configs[status] || configs.pending
  }

  if (loading) {
    return (
      <div className="container" style={{ maxWidth: '1000px' }}>
        <div className="loading-container" style={{ minHeight: '60vh' }}>
          <div className="loading-content">
            <div className="spinner" />
            <p className="loading-text">Cargando fechas...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={{ maxWidth: '1000px' }}>
      {/* Header */}
      <div style={{ marginBottom: '16px', textAlign: 'center' }}>
        <h2
          style={{
            fontSize: '1.75rem',
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
          <span style={{ fontSize: '2rem' }}>📅</span>
          <span>Gestión de Fechas</span>
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
          Administrá el estado de cada fecha del torneo
        </p>
      </div>

      {/* Active Round Card */}
      {activeRound && (
        <div
          className="card"
          style={{
            marginBottom: '32px',
            backgroundColor: 'var(--color-surface)',
            border: '3px solid #10b981',
            borderRadius: '16px',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.2)',
            position: 'relative',
            overflow: 'hidden',
            padding: '32px 28px',
          }}
        >
          {/* Barra lateral verde */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '8px',
              background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
            }}
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '28px',
              paddingLeft: '16px',
            }}
          >
            <div style={{ flex: 1, minWidth: '240px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  padding: '8px 18px',
                  borderRadius: '12px',
                  marginBottom: '16px',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>🟢</span>
                <span
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    color: '#047857',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                  }}
                >
                  Fecha Activa
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  marginBottom: '12px',
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    border: '2px solid rgba(16, 185, 129, 0.2)',
                  }}
                >
                  📅
                </div>
                <p
                  style={{
                    fontSize: '2.25rem',
                    fontWeight: '700',
                    color: 'var(--color-text-primary)',
                    margin: 0,
                    lineHeight: 1,
                  }}
                >
                  Fecha {activeRound.round_number}
                </p>
              </div>
              <p
                style={{
                  fontSize: '0.95rem',
                  color: 'var(--color-text-secondary)',
                  margin: 0,
                  lineHeight: 1.5,
                  paddingLeft: '80px',
                }}
              >
                Los usuarios pueden cargar sus pronósticos
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={handleLockRound}
                style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: 'white',
                  padding: '16px 28px',
                  borderRadius: '14px',
                  border: 'none',
                  fontWeight: '700',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 6px 16px rgba(239, 68, 68, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'
                  e.currentTarget.style.boxShadow = '0 10px 24px rgba(239, 68, 68, 0.45)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)'
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.35)'
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>🔒</span>
                <span>Bloquear Fecha</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Panel de Administración */}
      <div
        className="card"
        style={{
          marginBottom: '24px',
          padding: '24px',
          backgroundColor: 'rgba(239, 68, 68, 0.05)',
          border: '2px solid #ef4444',
        }}
      >
        <h3
          style={{
            marginBottom: '16px',
            color: '#b91c1c',
            fontSize: '1.1rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <span style={{ fontSize: '1.4rem' }}>🔧</span>
          <span>Panel de Administración</span>
        </h3>

        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: 'var(--color-text-primary)',
              fontSize: '0.9rem',
            }}
          >
            Número de Fecha:
          </label>
          <input
            type="number"
            value={roundNumber}
            onChange={e => setRoundNumber(parseInt(e.target.value) || 1)}
            min="1"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '1rem',
              borderRadius: '8px',
              border: '2px solid #E0E0E0',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = 'var(--color-primary)'
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = '#E0E0E0'
            }}
          />
        </div>

        <div
          style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={handleRecalculate}
            disabled={adminLoading}
            style={{
              flex: '1 1 auto',
              minWidth: '150px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: 'white',
              padding: '14px 20px',
              borderRadius: '10px',
              border: 'none',
              fontWeight: '700',
              fontSize: '0.95rem',
              cursor: adminLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: adminLoading ? 0.6 : 1,
            }}
            onMouseEnter={e => {
              if (!adminLoading) {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.45)'
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.35)'
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>🔄</span>
            <span>{adminLoading ? 'Procesando...' : 'Recalcular Puntos'}</span>
          </button>

          <button
            onClick={handleReset}
            disabled={adminLoading}
            style={{
              flex: '1 1 auto',
              minWidth: '150px',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              padding: '14px 20px',
              borderRadius: '10px',
              border: 'none',
              fontWeight: '700',
              fontSize: '0.95rem',
              cursor: adminLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: adminLoading ? 0.6 : 1,
            }}
            onMouseEnter={e => {
              if (!adminLoading) {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.45)'
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.35)'
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>🗑️</span>
            <span>{adminLoading ? 'Procesando...' : 'Resetear Fecha'}</span>
          </button>

          <button
            onClick={handleForceFinish}
            disabled={adminLoading}
            style={{
              flex: '1 1 auto',
              minWidth: '150px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: 'white',
              padding: '14px 20px',
              borderRadius: '10px',
              border: 'none',
              fontWeight: '700',
              fontSize: '0.95rem',
              cursor: adminLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: adminLoading ? 0.6 : 1,
            }}
            onMouseEnter={e => {
              if (!adminLoading) {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(245, 158, 11, 0.45)'
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.35)'
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>🏁</span>
            <span>{adminLoading ? 'Procesando...' : 'Forzar Finalización'}</span>
          </button>
        </div>
      </div>

      {/* Rounds List */}
      <div className="card" style={{ padding: '0' }}>
        <div style={{ padding: '0' }}>
          <div
            style={{
              display: 'grid',
              gap: '12px',
            }}
          >
            {rounds.map(round => {
              const statusConfig = getStatusConfig(round.status)
              const isActive = round.status === 'open'

              return (
                <div
                  key={round.id}
                  style={{
                    border: `2px solid ${isActive ? statusConfig.border : '#E0E0E0'}`,
                    borderRadius: '12px',
                    padding: '12px',
                    backgroundColor: isActive ? statusConfig.bg : 'var(--color-surface)',
                    transition: 'all 0.2s',
                    boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  {/* Round Info - Optimizada */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '12px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '1.1rem',
                        fontWeight: '700',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      Fecha {round.round_number}
                    </span>
                    <span
                      style={{
                        backgroundColor: statusConfig.bg,
                        border: `2px solid ${statusConfig.border}`,
                        color: statusConfig.color,
                        padding: '3px 10px',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <span>{statusConfig.icon}</span>
                      <span>{statusConfig.label}</span>
                    </span>
                  </div>

                  {/* Status Selector */}
                  <select
                    value={round.status}
                    onChange={e =>
                      handleChangeStatus(round.round_number, e.target.value, round.status, round.id)
                    }
                    disabled={round.status === 'finished'}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '2px solid #E0E0E0',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text-primary)',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      cursor: round.status === 'finished' ? 'not-allowed' : 'pointer',
                      opacity: round.status === 'finished' ? 0.6 : 1,
                      outline: 'none',
                      transition: 'all 0.2s',
                      marginBottom: round.status === 'locked' ? '12px' : '0',
                    }}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = 'var(--color-primary)'
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = '#E0E0E0'
                    }}
                  >
                    <option value="pending">⏳ Pendiente</option>
                    <option value="open">🟢 Abierta</option>
                    <option value="locked">🔒 Bloqueada</option>
                    <option value="finished">✅ Finalizada</option>
                  </select>

                  {/* Botón Finalizar */}
                  {round.status === 'locked' && (
                    <button
                      onClick={() => handleFinishRound(round.round_number)}
                      disabled={
                        !matchesByRound[round.round_number] ||
                        matchesByRound[round.round_number]?.finished <
                          matchesByRound[round.round_number]?.total
                      }
                      style={{
                        width: '100%',
                        background:
                          !matchesByRound[round.round_number] ||
                          matchesByRound[round.round_number]?.finished <
                            matchesByRound[round.round_number]?.total
                            ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                            : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        color: 'white',
                        padding: '10px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        fontWeight: '600',
                        fontSize: '0.85rem',
                        cursor:
                          !matchesByRound[round.round_number] ||
                          matchesByRound[round.round_number]?.finished <
                            matchesByRound[round.round_number]?.total
                            ? 'not-allowed'
                            : 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        opacity:
                          !matchesByRound[round.round_number] ||
                          matchesByRound[round.round_number]?.finished <
                            matchesByRound[round.round_number]?.total
                            ? 0.6
                            : 1,
                      }}
                      onMouseEnter={e => {
                        if (
                          matchesByRound[round.round_number] &&
                          matchesByRound[round.round_number]?.finished ===
                            matchesByRound[round.round_number]?.total
                        ) {
                          e.currentTarget.style.transform = 'translateY(-2px)'
                        }
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'translateY(0)'
                      }}
                      title={
                        !matchesByRound[round.round_number]
                          ? 'No hay partidos en esta fecha'
                          : matchesByRound[round.round_number]?.finished <
                              matchesByRound[round.round_number]?.total
                            ? `Partidos finalizados: ${matchesByRound[round.round_number]?.finished}/${matchesByRound[round.round_number]?.total}`
                            : 'Todos los partidos están finalizados'
                      }
                    >
                      <span>✅</span>
                      <span>
                        Finalizar
                        {matchesByRound[round.round_number] &&
                          ` (${matchesByRound[round.round_number]?.finished}/${matchesByRound[round.round_number]?.total})`}
                      </span>
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div
        className="card"
        style={{
          marginTop: '24px',
          backgroundColor: 'rgba(59, 130, 246, 0.05)',
          border: '2px solid #3b82f6',
        }}
      >
        <h3
          style={{
            fontWeight: '700',
            color: '#1e40af',
            marginBottom: '12px',
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '1.3rem' }}>ℹ️</span>
          <span>Estados de las Fechas</span>
        </h3>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontSize: '0.9rem',
            color: '#1e40af',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>⏳</span>
            <strong>Pendiente:</strong>
            <span style={{ color: '#4b5563' }}>Fecha creada pero aún no abierta</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>🟢</span>
            <strong>Abierta:</strong>
            <span style={{ color: '#4b5563' }}>Los usuarios pueden cargar pronósticos</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>🔒</span>
            <strong>Bloqueada:</strong>
            <span style={{ color: '#4b5563' }}>No se pueden modificar pronósticos</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>✅</span>
            <strong>Finalizada:</strong>
            <span style={{ color: '#4b5563' }}>
              Todos los partidos finalizaron y puntajes calculados
            </span>
          </div>
        </div>
      </div>

      {/* Toast notifications */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
