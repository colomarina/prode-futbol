import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRounds } from '../../hooks/useRounds'
import { useMatchesMeta } from '../../hooks/useMatchesMeta'
import { useTournament } from '../../contexts/TournamentContext'
import { supabase } from '../../lib/supabase'
import Toast from '../Common/Toast'
import LoadingState from '../Common/LoadingState'
import Button from '../Common/Button'
import { getRoundDisplayName, getRoundDisplayNameByNumber } from '../../utils/roundLabels'
import { filterHiddenPlayers } from '../../constants/hiddenPlayers'
import { tint } from '../../utils/tint'

/**
 * Los colores de la tarjeta de la fecha activa.
 *
 * Este panel tenía una paleta propia: el emerald de Tailwind (#10b981, #059669,
 * #047857) con seis alfas distintas de tinte —0.05, 0.1, 0.12, 0.15, 0.2, 0.3—
 * todas escritas a mano. O sea que en un torneo con otra paleta el panel seguía
 * siendo verde igual, y en tema oscuro los fondos claritos quedaban raros.
 *
 * Ahora todo sale de `--color-success`. Los tintes bajaron de seis pasos a
 * cuatro: 0.1 y 0.12 eran indistinguibles, igual que 0.15 y 0.2 en el borde.
 */
const ACTIVA = {
  linea: 'var(--color-success)',
  texto: 'var(--color-success-text)',
  fondoSuave: tint('var(--color-success)', 5),
  fondo: tint('var(--color-success)', 10),
  fondoFuerte: tint('var(--color-success)', 15),
  borde: tint('var(--color-success)', 20),
  bordeFuerte: tint('var(--color-success)', 30),
}

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
        bg: tint('var(--color-text-secondary)', 10),
        border: 'var(--color-text-secondary)',
        color: 'var(--color-text-secondary)',
        icon: '⏳',
        label: 'Pendiente',
      },
      open: {
        bg: ACTIVA.fondo,
        border: ACTIVA.linea,
        color: ACTIVA.texto,
        icon: '🟢',
        label: 'Abierta',
      },
      // `border` va con el token de relleno y `color` con el de texto: sobre el
      // fondo tinteado, `--color-error` como letra da 2.9:1 en tema oscuro.
      locked: {
        bg: tint('var(--color-error)', 10),
        border: 'var(--color-error)',
        color: 'var(--color-error-text)',
        icon: '🔒',
        label: 'Bloqueada',
      },
      finished: {
        bg: tint('var(--color-info)', 10),
        border: 'var(--color-info)',
        color: 'var(--color-info-text)',
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
      <div className="container" style={{ maxWidth: '1000px' }}>
        <LoadingState message="Cargando fechas..." />
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
            color: 'var(--color-primary-text)',
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
            border: `3px solid ${ACTIVA.linea}`,
            borderRadius: '16px',
            boxShadow: `0 8px 24px ${ACTIVA.borde}`,
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
              background:
                'linear-gradient(180deg, var(--color-success-light) 0%, var(--color-success) 100%)',
            }}
          />

          <div style={{ paddingLeft: '16px' }}>
            {/* Header */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                backgroundColor: ACTIVA.fondo,
                padding: '8px 18px',
                borderRadius: '12px',
                marginBottom: '16px',
                border: `1px solid ${ACTIVA.borde}`,
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>🟢</span>
              <span
                style={{
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  color: ACTIVA.texto,
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
                  backgroundColor: ACTIVA.fondo,
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  border: `2px solid ${ACTIVA.borde}`,
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
                  backgroundColor: ACTIVA.fondoSuave,
                  border: `2px solid ${ACTIVA.borde}`,
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
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => setShowDetails(!showDetails)}
                    aria-expanded={showDetails}
                  >
                    <span aria-hidden="true">{showDetails ? '▼' : '▶'}</span>
                    <span>{showDetails ? 'Ocultar detalles' : 'Ver detalles'}</span>
                  </Button>
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
                      border: '2px solid var(--color-success)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '1.8rem',
                        fontWeight: '700',
                        color: 'var(--color-success-text)',
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
                      border: '2px solid var(--color-warning)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '1.8rem',
                        fontWeight: '700',
                        color: 'var(--color-warning-text)',
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
                      border: '2px solid var(--color-error)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '1.8rem',
                        fontWeight: '700',
                        color: 'var(--color-error-text)',
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
                      borderTop: `2px solid ${ACTIVA.fondoFuerte}`,
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
                                  ? 'var(--color-success)'
                                  : user.progress > 0
                                    ? 'var(--color-warning)'
                                    : 'var(--color-error)'
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
                                          backgroundColor: tint('var(--color-warning)', 15),
                                          color: 'var(--color-warning-text)',
                                          padding: '2px 8px',
                                          borderRadius: '6px',
                                          fontSize: '0.75rem',
                                          fontWeight: '700',
                                          border: `1px solid ${tint('var(--color-warning)', 40)}`,
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
                                    backgroundColor: ACTIVA.fondoFuerte,
                                    color: ACTIVA.texto,
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
              const roundMatches = matchesByRound[round.round_number]

              // Una fecha se puede finalizar solo si todos sus partidos están
              // cargados. La condición estaba escrita cinco veces inline en el
              // mismo botón: en el fondo, en el cursor, en el opacity, en el
              // hover y en el title.
              const puedeFinalizar = Boolean(
                roundMatches && roundMatches.finished >= roundMatches.total
              )
              const motivoFinalizar = !roundMatches
                ? 'No hay partidos en esta fecha'
                : puedeFinalizar
                  ? 'Todos los partidos están finalizados'
                  : `Partidos finalizados: ${roundMatches.finished}/${roundMatches.total}`

              return (
                <div
                  key={round.id}
                  style={{
                    border: `2px solid ${isActive ? statusConfig.border : 'var(--color-border)'}`,
                    borderRadius: '12px',
                    padding: '12px',
                    backgroundColor: isActive ? statusConfig.bg : 'var(--color-surface)',
                    transition: 'all 0.2s',
                    boxShadow: isActive ? 'var(--shadow-md)' : 'none',
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
                    {/* El conteo de partidos vivia solo dentro del boton Finalizar, que
                        aparece nada mas cuando la fecha esta bloqueada: en una fecha
                        finalizada o pendiente no habia forma de ver cuantos partidos
                        tiene ni cuantos se cargaron. */}
                    {roundMatches && (
                      <span
                        title={`Partidos finalizados: ${roundMatches.finished}/${roundMatches.total}`}
                        style={{
                          backgroundColor: 'var(--color-surface-highlight)',
                          border: '2px solid var(--color-border)',
                          color:
                            roundMatches.finished === roundMatches.total
                              ? 'var(--color-primary)'
                              : 'var(--color-text-secondary)',
                          padding: '3px 10px',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        <span aria-hidden="true">⚽</span>
                        <span>
                          {roundMatches.finished}/{roundMatches.total}
                        </span>
                      </span>
                    )}
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
                    <Button
                      variant="info"
                      size="sm"
                      fullWidth
                      onClick={() => handleFinishRound(round.round_number)}
                      disabled={!puedeFinalizar}
                      title={motivoFinalizar}
                    >
                      <span>✅</span>
                      <span>
                        Finalizar
                        {roundMatches && ` (${roundMatches.finished}/${roundMatches.total})`}
                      </span>
                    </Button>
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
