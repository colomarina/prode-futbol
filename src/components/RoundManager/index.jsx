import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRounds } from '../../hooks/useRounds'
import { useMatchesMeta } from '../../hooks/useMatchesMeta'
import { useTournament } from '../../contexts/TournamentContext'
import { supabase } from '../../lib/supabase'
import Toast from '../Common/Toast'
import { getRoundDisplayName, getRoundDisplayNameByNumber } from '../../utils/roundLabels'
import { filterHiddenPlayers } from '../../constants/hiddenPlayers'

export default function RoundManager() {
  const { activeTournament } = useTournament()
  const { rounds, activeRound, updateRoundStatus, finishRound, loading } = useRounds(
    activeTournament?.id
  )
  const { matchesMeta } = useMatchesMeta(activeTournament?.id)
  const [toast, setToast] = useState(null)
  const [usersPredictions, setUsersPredictions] = useState([])
  const [showDetails, setShowDetails] = useState(false)

  const formatRoundLabel = useCallback(
    roundNumber => getRoundDisplayNameByNumber(roundNumber, rounds),
    [rounds]
  )

  // Cuántos partidos tiene cada fecha y cuántos ya terminaron. Sale de la misma
  // query compartida que usa useRounds, no de una consulta propia.
  const matchesByRound = useMemo(() => {
    const byRound = {}

    matchesMeta.forEach(match => {
      if (!byRound[match.round_number]) {
        byRound[match.round_number] = { total: 0, finished: 0 }
      }
      byRound[match.round_number].total += 1
      if (match.is_finished) {
        byRound[match.round_number].finished += 1
      }
    })

    return byRound
  }, [matchesMeta])

  // Cargar información de predicciones de usuarios para la fecha activa
  useEffect(() => {
    const fetchUsersPredictions = async () => {
      if (!activeRound) {
        setUsersPredictions([])
        return
      }

      try {
        let data = null
        let lastError = null

        if (activeTournament?.id) {
          // Las dos variantes filtran por torneo; se prueban en orden porque no
          // todas las bases tienen la _v2. Se usa un flag y no la truthiness de
          // data: un [] legitimo tiene que cortar la cadena.
          const scopedRpcNames = [
            'get_round_predictions_summary_by_tournament_v2',
            'get_round_predictions_summary_by_tournament',
          ]

          for (const rpcName of scopedRpcNames) {
            const attempt = await supabase.rpc(rpcName, {
              p_tournament_id: activeTournament.id,
              p_round_num: activeRound.round_number,
            })

            if (!attempt.error) {
              data = attempt.data || []
              break
            }
            lastError = attempt.error
          }

          // Antes, si las dos fallaban se caia a get_round_predictions_summary,
          // que no filtra por torneo: los round_number se repiten entre torneos,
          // asi que el admin veia el progreso de jugadores de otro torneo como
          // si fuera de este. Mejor no mostrar nada y avisar.
          if (data === null) throw lastError || new Error('No se pudo consultar el progreso')
        } else {
          const legacyRpc = await supabase.rpc('get_round_predictions_summary', {
            round_num: activeRound.round_number,
          })

          if (legacyRpc.error) throw legacyRpc.error
          data = legacyRpc.data || []
        }

        // Mapear los datos al formato que usa el componente
        const usersData = data.map(user => ({
          id: user.user_id,
          name: user.user_name,
          totalMatches: user.total_matches,
          predictedCount: user.predicted_count,
          missingMatches: user.missing_matches,
          progress: parseFloat(user.progress),
          roundNumber: user.round_number ?? activeRound.round_number,
        }))

        setUsersPredictions(filterHiddenPlayers(usersData))
      } catch {
        setUsersPredictions([])
        setToast({
          message: 'No se pudo cargar el progreso de los jugadores',
          type: 'error',
        })
      }
    }

    fetchUsersPredictions()
  }, [activeRound, activeTournament?.id])

  const getStatusConfig = useCallback(status => {
    const configs = {
      pending: {
        bg: 'rgba(156, 163, 175, 0.1)',
        border: 'var(--color-text-secondary)',
        color: 'var(--color-text-secondary)',
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
        border: 'var(--color-error)',
        color: 'var(--color-error)',
        icon: '🔒',
        label: 'Bloqueada',
      },
      finished: {
        bg: 'rgba(59, 130, 246, 0.1)',
        border: 'var(--color-info)',
        color: 'var(--color-info)',
        icon: '✅',
        label: 'Finalizada',
      },
    }
    return configs[status] || configs.pending
  }, [])

  const handleFinishRound = useCallback(
    async roundNumber => {
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

      if (confirm(`¿Finalizar ${formatRoundLabel(roundNumber)}? Se calcularán los puntajes.`)) {
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
    },
    [matchesByRound, finishRound, formatRoundLabel]
  )

  const handleChangeStatus = useCallback(
    async (roundNumber, newStatus, currentStatus, roundId) => {
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
            message: `Ya hay una fecha abierta (${getRoundDisplayName(openRound)}). Bloqueala o finalizala antes.`,
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

      if (
        confirm(
          `¿Cambiar estado de ${formatRoundLabel(roundNumber)} a "${statusNames[newStatus]}"?`
        )
      ) {
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
    },
    [formatRoundLabel, rounds, updateRoundStatus]
  )

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
          Cargando fechas...
        </p>
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
            padding: '28px',
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

          <div style={{ paddingLeft: '16px' }}>
            {/* Header */}
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
                Fecha activa por partidas
              </span>
            </div>

            {/* Round Info */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '24px',
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
              <div>
                <p
                  style={{
                    fontSize: '2.25rem',
                    fontWeight: '700',
                    color: 'var(--color-text-primary)',
                    margin: 0,
                    lineHeight: 1,
                    marginBottom: '8px',
                  }}
                >
                  {getRoundDisplayName(activeRound)}
                </p>
                <p
                  style={{
                    fontSize: '0.95rem',
                    color: 'var(--color-text-secondary)',
                    margin: 0,
                  }}
                >
                  La fecha activa se calcula por el partido más próximo que todavía no empezó
                </p>
              </div>
            </div>

            {/* Users Progress Summary */}
            {usersPredictions.length > 0 && (
              <div
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.05)',
                  border: '2px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '16px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '1.8rem' }}>👥</span>
                    <div>
                      <h4
                        style={{
                          margin: 0,
                          fontSize: '1.1rem',
                          fontWeight: '700',
                          color: 'var(--color-text-primary)',
                        }}
                      >
                        Progreso de Usuarios
                      </h4>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '0.85rem',
                          color: 'var(--color-text-secondary)',
                          marginTop: '2px',
                        }}
                      >
                        {usersPredictions.filter(u => u.progress === 100).length} de{' '}
                        {usersPredictions.length} completaron la fecha
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    style={{
                      background: showDetails
                        ? 'rgba(16, 185, 129, 0.15)'
                        : 'rgba(16, 185, 129, 0.1)',
                      color: '#047857',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '2px solid rgba(16, 185, 129, 0.3)',
                      fontWeight: '600',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>{showDetails ? '▼' : '▶'}</span>
                    <span>{showDetails ? 'Ocultar detalles' : 'Ver detalles'}</span>
                  </button>
                </div>

                {/* Summary Stats */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '12px',
                    marginBottom: showDetails ? '20px' : '0',
                  }}
                >
                  <div
                    style={{
                      backgroundColor: 'var(--color-surface)',
                      padding: '12px',
                      borderRadius: '10px',
                      textAlign: 'center',
                      border: '2px solid #10b981',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '1.8rem',
                        fontWeight: '700',
                        color: '#10b981',
                        marginBottom: '4px',
                      }}
                    >
                      {usersPredictions.filter(u => u.progress === 100).length}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                      Completaron
                    </div>
                  </div>
                  <div
                    style={{
                      backgroundColor: 'var(--color-surface)',
                      padding: '12px',
                      borderRadius: '10px',
                      textAlign: 'center',
                      border: '2px solid #f59e0b',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '1.8rem',
                        fontWeight: '700',
                        color: '#f59e0b',
                        marginBottom: '4px',
                      }}
                    >
                      {usersPredictions.filter(u => u.progress > 0 && u.progress < 100).length}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                      En progreso
                    </div>
                  </div>
                  <div
                    style={{
                      backgroundColor: 'var(--color-surface)',
                      padding: '12px',
                      borderRadius: '10px',
                      textAlign: 'center',
                      border: '2px solid #ef4444',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '1.8rem',
                        fontWeight: '700',
                        color: '#ef4444',
                        marginBottom: '4px',
                      }}
                    >
                      {usersPredictions.filter(u => u.progress === 0).length}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                      Sin empezar
                    </div>
                  </div>
                </div>

                {/* Detailed User List */}
                {showDetails && (
                  <div
                    style={{
                      maxHeight: '400px',
                      overflowY: 'auto',
                      borderTop: '2px solid rgba(16, 185, 129, 0.15)',
                      paddingTop: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {usersPredictions
                        .sort((a, b) => b.progress - a.progress)
                        .map(user => (
                          <div
                            key={user.id}
                            style={{
                              backgroundColor: 'var(--color-surface)',
                              padding: '12px 16px',
                              borderRadius: '10px',
                              border: `2px solid ${
                                user.progress === 100
                                  ? '#10b981'
                                  : user.progress > 0
                                    ? '#f59e0b'
                                    : '#ef4444'
                              }`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '12px',
                              flexWrap: 'wrap',
                            }}
                          >
                            <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  marginBottom: '6px',
                                }}
                              >
                                <span style={{ fontSize: '1.1rem' }}>
                                  {user.progress === 100 ? '✅' : user.progress > 0 ? '⚠️' : '❌'}
                                </span>
                                <span
                                  style={{
                                    fontWeight: '600',
                                    color: 'var(--color-text-primary)',
                                    fontSize: '0.95rem',
                                  }}
                                >
                                  {user.name}
                                </span>
                              </div>
                              <div
                                style={{
                                  fontSize: '0.8rem',
                                  color: 'var(--color-text-secondary)',
                                }}
                              >
                                {user.predictedCount} de {user.totalMatches} partidos
                              </div>
                            </div>

                            <div style={{ flex: '0 0 auto', minWidth: 0, maxWidth: '100%' }}>
                              {user.missingMatches.length > 0 ? (
                                <div
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-end',
                                    gap: '6px',
                                    width: '100%',
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: '0.75rem',
                                      color: 'var(--color-text-secondary)',
                                      fontWeight: '600',
                                    }}
                                  >
                                    Faltan partidos:
                                  </span>
                                  <div
                                    style={{
                                      display: 'flex',
                                      gap: '4px',
                                      flexWrap: 'wrap',
                                      justifyContent: 'flex-end',
                                      maxWidth: '200px',
                                    }}
                                  >
                                    {user.missingMatches.map(matchNum => (
                                      <span
                                        key={matchNum}
                                        style={{
                                          backgroundColor: '#fef3c7',
                                          color: '#92400e',
                                          padding: '2px 8px',
                                          borderRadius: '6px',
                                          fontSize: '0.75rem',
                                          fontWeight: '700',
                                          border: '1px solid #fcd34d',
                                          whiteSpace: 'nowrap',
                                        }}
                                      >
                                        #{matchNum}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <span
                                  style={{
                                    backgroundColor: '#d1fae5',
                                    color: '#065f46',
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    fontSize: '0.8rem',
                                    fontWeight: '700',
                                  }}
                                >
                                  Completo ✓
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

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
                    border: `2px solid ${isActive ? statusConfig.border : 'var(--color-border)'}`,
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
                      {getRoundDisplayName(round)}
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
                      border: '2px solid var(--color-border)',
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
                      e.currentTarget.style.borderColor = 'var(--color-border)'
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

      {/* Toast notifications */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
