import { useState } from 'react'
import { useRounds } from '../../hooks/useRounds'
import { useMatches } from '../../hooks/useMatches'
import TeamDisplay from '../TeamDisplay'

export default function MatchManager() {
  const { rounds } = useRounds()
  const [selectedRound, setSelectedRound] = useState(null)
  const { matches, loading: matchesLoading, updateMatch } = useMatches(selectedRound)

  // Filtrar solo fechas cerradas
  const closedRounds = rounds.filter(r => r.status === 'locked')

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
        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: 'var(--color-primary)',
            marginBottom: '8px',
          }}
        >
          ⚙️ Cargar Resultados
        </h2>
      </div>

      {/* Selector de fecha */}
      <div className="card" style={{ marginBottom: '12px' }}>
        <label className="form-label">📅 Seleccioná una Fecha Cerrada</label>
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
                {matches.map(match => {
                  const matchDate = new Date(match.match_date)
                  const formattedDate = matchDate.toLocaleDateString('es-AR', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    timeZone: 'America/Argentina/Buenos_Aires',
                  })
                  const formattedTime = matchDate.toLocaleTimeString('es-AR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                    timeZone: 'America/Argentina/Buenos_Aires',
                  })

                  return (
                    <div
                      key={match.id}
                      className="card"
                      style={{
                        position: 'relative',
                        overflow: 'hidden',
                        background: 'linear-gradient(to bottom, #ffffff, #fafafa)',
                        border: '1px solid #e2e8f0',
                        borderRadius: '16px',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
                        padding: '8px',
                      }}
                    >
                      {/* Match Number */}
                      <div
                        style={{
                          position: 'absolute',
                          top: '12px',
                          left: '12px',
                          backgroundColor: 'var(--color-primary)',
                          color: 'white',
                          padding: '6px 12px',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: '700',
                        }}
                      >
                        #{match.match_number || '?'}
                      </div>

                      {/* Match Status Badge */}
                      {match.is_finished && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            backgroundColor: 'var(--color-success)',
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                          }}
                        >
                          Finalizado
                        </div>
                      )}

                      {/* Match Date and Time */}
                      <div
                        style={{
                          marginTop: '36px',
                          marginBottom: '16px',
                          textAlign: 'center',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            color: 'var(--color-text-secondary)',
                          }}
                        >
                          📅 {formattedDate} • 🕐 {formattedTime}
                        </span>
                      </div>

                      {/* Teams and Score */}
                      <div style={{ marginBottom: '20px' }}>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr auto auto auto 1fr',
                            gap: '10px',
                            alignItems: 'center',
                          }}
                        >
                          {/* Home Team */}
                          <div style={{ justifySelf: 'end', textAlign: 'center' }}>
                            <TeamDisplay team={match.home_team} size="sm" showNameBelow />
                          </div>

                          {/* Home Score */}
                          <div
                            style={{
                              width: '50px',
                              padding: '10px 6px',
                              textAlign: 'center',
                              fontSize: '1.4rem',
                              fontWeight: '700',
                              borderRadius: '10px',
                              border: match.is_finished
                                ? '3px solid var(--color-success)'
                                : '3px solid #E0E0E0',
                              backgroundColor: match.is_finished
                                ? 'var(--color-surface)'
                                : '#FAFAFA',
                              color: match.is_finished
                                ? 'var(--color-success)'
                                : 'var(--color-text-secondary)',
                            }}
                          >
                            {match.is_finished ? match.home_score : '-'}
                          </div>

                          {/* Separator */}
                          <span
                            style={{
                              fontSize: '1.4rem',
                              fontWeight: '700',
                              color: 'var(--color-text-secondary)',
                              padding: '0 2px',
                            }}
                          >
                            -
                          </span>

                          {/* Away Score */}
                          <div
                            style={{
                              width: '50px',
                              padding: '10px 6px',
                              textAlign: 'center',
                              fontSize: '1.4rem',
                              fontWeight: '700',
                              borderRadius: '10px',
                              border: match.is_finished
                                ? '3px solid var(--color-success)'
                                : '3px solid #E0E0E0',
                              backgroundColor: match.is_finished
                                ? 'var(--color-surface)'
                                : '#FAFAFA',
                              color: match.is_finished
                                ? 'var(--color-success)'
                                : 'var(--color-text-secondary)',
                            }}
                          >
                            {match.is_finished ? match.away_score : '-'}
                          </div>

                          {/* Away Team */}
                          <div style={{ justifySelf: 'start', textAlign: 'center' }}>
                            <TeamDisplay team={match.away_team} size="sm" showNameBelow />
                          </div>
                        </div>
                      </div>

                      {/* Button */}
                      <button
                        onClick={() => handleUpdateResult(match.id)}
                        className="btn-success"
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          fontSize: '1rem',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                        }}
                      >
                        {match.is_finished ? (
                          <>
                            <span>✏️</span>
                            <span>Editar Resultado</span>
                          </>
                        ) : (
                          <>
                            <span>⚽</span>
                            <span>Cargar Resultado</span>
                          </>
                        )}
                      </button>
                    </div>
                  )
                })}
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
