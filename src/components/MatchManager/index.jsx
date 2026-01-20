import { useState } from 'react'
import { useRounds } from '../../hooks/useRounds'
import { useMatches } from '../../hooks/useMatches'
import TeamDisplay from '../TeamDisplay'

export default function MatchManager() {
  const { rounds } = useRounds()
  const [selectedRound, setSelectedRound] = useState(null)
  const { matches, loading: matchesLoading, updateMatch } = useMatches(selectedRound)

  // Filtrar solo fechas cerradas
  const closedRounds = rounds.filter(r => r.status === 'closed')

  const handleUpdateResult = async matchId => {
    const homeScore = prompt('Goles Local:')
    const awayScore = prompt('Goles Visitante:')

    if (homeScore !== null && awayScore !== null) {
      const { error } = await updateMatch(matchId, {
        home_score: parseInt(homeScore),
        away_score: parseInt(awayScore),
        is_finished: true,
      })

      if (error) {
        alert(`Error: ${error.message}`)
      } else {
        alert('Resultado actualizado!')
      }
    }
  }

  return (
    <div className="container" style={{ maxWidth: '1000px' }}>
      <div style={{ marginBottom: '8px', textAlign: 'center' }}>
        {/* <h2
          style={{
            fontSize: '1.75rem',
            fontWeight: '700',
            color: 'var(--color-primary)',
            marginBottom: '8px',
          }}
        >
          ⚙️ Cargar Resultados
        </h2> */}
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Cargá los resultados de los partidos cerrados
        </p>
      </div>

      {/* Selector de fecha */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <label className="form-label">📅 Seleccioná una Fecha Cerrada</label>
        <select
          value={selectedRound || ''}
          onChange={e => setSelectedRound(Number(e.target.value))}
          className="form-input"
        >
          <option value="">Seleccionar fecha...</option>
          {closedRounds.map(round => (
            <option key={round.id} value={round.round_number}>
              Fecha {round.round_number}
            </option>
          ))}
        </select>
      </div>

      {/* Lista de partidos */}
      {selectedRound ? (
        matchesLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--color-text-secondary)' }}>Cargando partidos...</p>
          </div>
        ) : (
          <div className="card">
            <h3
              style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: 'var(--color-text-primary)',
                marginBottom: '20px',
              }}
            >
              ⚽ Partidos de la Fecha {selectedRound}
            </h3>

            {!matches || matches.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚽</div>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  No hay partidos en esta fecha
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {matches.map(match => (
                  <div
                    key={match.id}
                    style={{
                      border: '2px solid #E0E0E0',
                      borderRadius: '12px',
                      padding: '16px',
                      backgroundColor: match.is_finished
                        ? 'var(--color-surface-variant)'
                        : 'var(--color-surface)',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '12px',
                            marginBottom: '12px',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              flexWrap: 'wrap',
                            }}
                          >
                            <TeamDisplay team={match.home_team} size="md" />
                            <span
                              style={{
                                fontSize: '1.2rem',
                                fontWeight: '700',
                                color: 'var(--color-text-secondary)',
                              }}
                            >
                              vs
                            </span>
                            <TeamDisplay team={match.away_team} size="md" />
                          </div>
                          {match.is_finished && (
                            <span
                              style={{
                                backgroundColor: 'var(--color-success)',
                                color: 'white',
                                padding: '4px 12px',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                              }}
                            >
                              ✅ Finalizado
                            </span>
                          )}
                        </div>
                        <p
                          style={{
                            fontSize: '0.9rem',
                            color: 'var(--color-text-secondary)',
                            marginBottom: '4px',
                          }}
                        >
                          📅{' '}
                          {new Date(match.match_date).toLocaleDateString('es-AR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        {match.is_finished && (
                          <p
                            style={{
                              fontSize: '1.1rem',
                              fontWeight: '700',
                              color: 'var(--color-success)',
                              marginTop: '8px',
                            }}
                          >
                            ⚽ Resultado: {match.home_score} - {match.away_score}
                          </p>
                        )}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          gap: '8px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <button
                          onClick={() => handleUpdateResult(match.id)}
                          className="btn-success"
                          style={{ flex: '1', minWidth: '200px' }}
                        >
                          {match.is_finished ? '✏️ Editar Resultado' : '⚽ Cargar Resultado'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      ) : (
        <div style={{ textAlign: 'center', padding: '48px 16px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📅</div>
          <h3 style={{ color: 'var(--color-text-primary)', marginBottom: '8px' }}>
            Seleccioná una fecha
          </h3>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Elegí una fecha cerrada para cargar los resultados
          </p>
        </div>
      )}
    </div>
  )
}
