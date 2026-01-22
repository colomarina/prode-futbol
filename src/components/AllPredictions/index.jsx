import { useState, useEffect } from 'react'
import { useRounds } from '../../hooks/useRounds'
import { useMatches } from '../../hooks/useMatches'
import { supabase } from '../../lib/supabase'
import TeamDisplay from '../TeamDisplay'

export default function AllPredictions() {
  const { rounds, loading: roundsLoading } = useRounds()
  const [selectedRound, setSelectedRound] = useState(null)
  const { matches, loading: matchesLoading } = useMatches(selectedRound)
  const [roundPredictions, setRoundPredictions] = useState({})
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState('')
  const [loading, setLoading] = useState(false)

  // Cargar usuarios
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, full_name')
          .order('full_name')

        if (error) throw error
        setUsers(data || [])
      } catch (error) {
        console.error('Error cargando usuarios:', error)
      }
    }

    fetchUsers()
  }, [])

  // Obtener el round actual seleccionado
  const currentRound = rounds.find(r => r.round_number === selectedRound)
  const isRoundOpen = currentRound?.status === 'open'

  // Cargar predicciones cuando se seleccionan fecha Y usuario (y la fecha NO está abierta)
  useEffect(() => {
    if (selectedRound && selectedUser && !isRoundOpen) {
      fetchPredictionsForRound()
    } else {
      setRoundPredictions({})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRound, selectedUser, isRoundOpen])

  const fetchPredictionsForRound = async () => {
    if (!selectedRound || !selectedUser || !matches.length) return

    setLoading(true)
    try {
      const matchIds = matches.map(m => m.id)

      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .in('match_id', matchIds)
        .eq('user_id', selectedUser)

      if (error) throw error

      // Organizar predicciones por match_id
      const predictionsByMatch = {}
      data?.forEach(pred => {
        predictionsByMatch[pred.match_id] = pred
      })

      setRoundPredictions(predictionsByMatch)
    } catch (error) {
      console.error('Error cargando pronósticos:', error)
      setRoundPredictions({})
    } finally {
      setLoading(false)
    }
  }

  // Verificar si el partido ya empezó
  const hasMatchStarted = match => {
    return new Date() >= new Date(match.match_date)
  }

  // Filtrar fechas disponibles para ver
  const availableRounds = rounds.filter(r => ['locked', 'finished'].includes(r.status))

  if (roundsLoading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '48px 16px' }}>
        <div className="spinner" style={{ margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--color-text-secondary)' }}>Cargando...</p>
      </div>
    )
  }

  return (
    <div className="container" style={{ maxWidth: '1000px' }}>
      {/* Header */}
      <div style={{ marginBottom: '12px', textAlign: 'center' }}>
        <h2
          style={{
            fontSize: '1.1rem',
            fontWeight: '700',
            color: 'var(--color-primary)',
            marginBottom: '8px',
          }}
        >
          👥 Mirá los pronósticos de los demás una vez que este en juego la fecha
        </h2>
      </div>

      {/* Mensaje cuando no hay fechas disponibles */}
      {availableRounds.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 16px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🔒</div>
          <h3
            style={{
              color: 'var(--color-text-primary)',
              marginBottom: '12px',
              fontSize: '1.5rem',
              fontWeight: '700',
            }}
          >
            Todavía no hay fechas para ver
          </h3>
          <p
            style={{
              color: 'var(--color-text-secondary)',
              fontSize: '1rem',
              lineHeight: 1.6,
              maxWidth: '500px',
              margin: '0 auto',
            }}
          >
            Los pronósticos de otros usuarios se podrán ver cuando las fechas estén bloqueadas o
            finalizadas. Por ahora, todas las fechas están abiertas o pendientes.
          </p>
        </div>
      )}

      {/* Selectores de fecha y usuario */}
      {availableRounds.length > 0 && (
        <div className="card" style={{ marginBottom: '8px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '16px',
            }}
            className="responsive-selectors"
          >
            <div style={{ width: '100%' }}>
              <label className="form-label">📅 Seleccioná una Fecha</label>
              <select
                value={selectedRound || ''}
                onChange={e => setSelectedRound(Number(e.target.value))}
                className="form-input"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '1rem',
                  borderRadius: '10px',
                  border: '2px solid var(--color-primary)',
                  cursor: 'pointer',
                }}
              >
                <option value="">Seleccionar fecha...</option>
                {availableRounds.map(round => (
                  <option key={round.id} value={round.round_number}>
                    Fecha {round.round_number}{' '}
                    {round.status === 'finished' ? '(Finalizada 🏁)' : '(En juego ⚽)'}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ width: '100%' }}>
              <label className="form-label">👤 Seleccionar Usuario</label>
              <select
                value={selectedUser}
                onChange={e => setSelectedUser(e.target.value)}
                className="form-input"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '1rem',
                  borderRadius: '10px',
                  border: '2px solid var(--color-primary)',
                  cursor: 'pointer',
                }}
              >
                <option value="">Seleccionar usuario...</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.full_name} (@{user.username})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <style>{`
          @media (min-width: 768px) {
            .responsive-selectors {
              grid-template-columns: 1fr 1fr !important;
            }
          }
        `}</style>
        </div>
      )}

      {/* Lista de partidos con pronósticos */}
      {availableRounds.length > 0 &&
        selectedRound &&
        selectedUser &&
        !matchesLoading &&
        matches.length > 0 &&
        !isRoundOpen && (
          <div>
            <h3
              style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                marginBottom: '16px',
                color: 'var(--color-text-primary)',
                textAlign: 'center',
              }}
            >
              Pronósticos de {users.find(u => u.id === selectedUser)?.full_name || 'Usuario'} -
              Fecha {selectedRound}
            </h3>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div className="spinner" style={{ margin: '0 auto 16px' }} />
                <p style={{ color: 'var(--color-text-secondary)' }}>Cargando pronósticos...</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {matches.map(match => {
                  const started = hasMatchStarted(match)
                  const prediction = roundPredictions[match.id]

                  return (
                    <div
                      key={match.id}
                      className="card"
                      style={{
                        padding: '12px',
                        opacity: started ? 1 : 0.6,
                        background: 'linear-gradient(to bottom, #ffffff, #fafafa)',
                        border: '1px solid #e2e8f0',
                        borderRadius: '16px',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
                      }}
                    >
                      {/* Header: Número y estado */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '12px',
                          paddingBottom: '8px',
                          borderBottom: '1px solid #f0f0f0',
                        }}
                      >
                        <span
                          style={{
                            backgroundColor: 'var(--color-primary)',
                            color: 'white',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                          }}
                        >
                          Partido #{match.match_number}
                        </span>

                        {!started ? (
                          <span
                            style={{
                              backgroundColor: '#ef4444',
                              color: 'white',
                              padding: '4px 10px',
                              borderRadius: '8px',
                              fontSize: '0.7rem',
                              fontWeight: '600',
                            }}
                          >
                            🔒 No empezó
                          </span>
                        ) : match.is_finished ? (
                          <span
                            style={{
                              backgroundColor: 'var(--color-success)',
                              color: 'white',
                              padding: '4px 10px',
                              borderRadius: '8px',
                              fontSize: '0.7rem',
                              fontWeight: '600',
                            }}
                          >
                            ✓ Finalizado
                          </span>
                        ) : (
                          <span
                            style={{
                              backgroundColor: '#f59e0b',
                              color: 'white',
                              padding: '4px 10px',
                              borderRadius: '8px',
                              fontSize: '0.7rem',
                              fontWeight: '600',
                            }}
                          >
                            ⚽ En juego
                          </span>
                        )}
                      </div>

                      {/* Partido y pronóstico */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr auto 1fr',
                          gap: '12px',
                          alignItems: 'center',
                        }}
                      >
                        {/* Equipo Local */}
                        <div style={{ justifySelf: 'end', textAlign: 'center' }}>
                          <TeamDisplay team={match.home_team} size="sm" showNameBelow />
                        </div>

                        {/* Pronóstico del usuario */}
                        <div style={{ textAlign: 'center', minWidth: '80px' }}>
                          {prediction ? (
                            <div>
                              <div
                                style={{
                                  fontSize: '0.7rem',
                                  color: 'var(--color-text-secondary)',
                                  marginBottom: '2px',
                                }}
                              >
                                Pronóstico
                              </div>
                              <div
                                style={{
                                  fontSize: '1.4rem',
                                  fontWeight: '700',
                                  color: 'var(--color-primary)',
                                }}
                              >
                                {prediction.home_prediction} - {prediction.away_prediction}
                              </div>

                              {match.is_finished && (
                                <div style={{ marginTop: '8px' }}>
                                  <div
                                    style={{
                                      fontSize: '0.65rem',
                                      color: 'var(--color-text-secondary)',
                                      marginBottom: '2px',
                                    }}
                                  >
                                    Resultado Real
                                  </div>
                                  <div
                                    style={{
                                      fontSize: '0.9rem',
                                      fontWeight: '600',
                                      color: '#64748b',
                                    }}
                                  >
                                    {match.home_score} - {match.away_score}
                                  </div>
                                  <div
                                    style={{
                                      marginTop: '4px',
                                      fontSize: '0.85rem',
                                      fontWeight: '600',
                                      color: prediction.points > 0 ? '#10b981' : '#ef4444',
                                    }}
                                  >
                                    {prediction.points > 0 ? '✅' : '❌'} {prediction.points} pts
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div
                              style={{
                                fontSize: '0.85rem',
                                color: 'var(--color-text-secondary)',
                                fontStyle: 'italic',
                              }}
                            >
                              Sin pronóstico
                            </div>
                          )}
                        </div>

                        {/* Equipo Visitante */}
                        <div style={{ justifySelf: 'start', textAlign: 'center' }}>
                          <TeamDisplay team={match.away_team} size="sm" showNameBelow />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

      {/* Mensaje cuando no hay partidos en la fecha */}
      {availableRounds.length > 0 &&
        selectedRound &&
        selectedUser &&
        !matchesLoading &&
        matches.length === 0 &&
        !isRoundOpen && (
          <div style={{ textAlign: 'center', padding: '0px 16px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚽</div>
            <h3 style={{ color: 'var(--color-text-primary)', marginBottom: '8px' }}>
              No hay partidos cargados
            </h3>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Esta fecha todavía no tiene partidos configurados
            </p>
          </div>
        )}

      {/* Mensaje cuando la fecha está abierta */}
      {availableRounds.length > 0 && selectedRound && selectedUser && isRoundOpen && (
        <div style={{ textAlign: 'center', padding: '8px 16px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔒</div>
          <h3 style={{ color: 'var(--color-text-primary)', marginBottom: '8px' }}>Fecha abierta</h3>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Los pronósticos se pueden ver una vez que la fecha esté cerrada
          </p>
        </div>
      )}

      {/* Mensaje cuando no hay selección */}
      {availableRounds.length > 0 && (!selectedRound || !selectedUser) && (
        <div style={{ textAlign: 'center', padding: '48px 16px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>👥</div>
          <h3 style={{ color: 'var(--color-text-primary)', marginBottom: '8px' }}>
            Seleccioná una fecha y un usuario
          </h3>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Elegí una fecha y un usuario para ver sus pronósticos
          </p>
        </div>
      )}
    </div>
  )
}
