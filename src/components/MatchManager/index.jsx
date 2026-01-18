import { useState } from 'react'
import { useMatches } from '../../hooks/useMatches'
import { useTeams } from '../../hooks/useTeams'
import TeamDisplay from '../TeamDisplay'

// Custom Team Select Component
function TeamSelect({ value, onChange, teams, placeholder, disabled }) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedTeam = teams.find(t => t.id === value)

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="form-input"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: disabled ? 'not-allowed' : 'pointer',
          backgroundColor: disabled ? '#FAFAFA' : 'var(--color-surface)',
          textAlign: 'left',
        }}
      >
        {selectedTeam ? (
          <TeamDisplay team={selectedTeam} size="sm" />
        ) : (
          <span style={{ color: 'var(--color-text-secondary)' }}>{placeholder}</span>
        )}
        <span style={{ marginLeft: '8px', color: 'var(--color-text-secondary)' }}>▼</span>
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
              top: 'calc(100% + 4px)',
              left: 0,
              right: 0,
              backgroundColor: 'var(--color-surface)',
              border: '2px solid var(--color-primary)',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              maxHeight: '300px',
              overflowY: 'auto',
              zIndex: 20,
            }}
          >
            {teams.map(team => (
              <button
                key={team.id}
                type="button"
                onClick={() => {
                  onChange(team.id)
                  setIsOpen(false)
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  backgroundColor:
                    value === team.id ? 'var(--color-surface-variant)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  textAlign: 'left',
                  borderBottom: '1px solid #E0E0E0',
                }}
                onMouseEnter={e => {
                  if (value !== team.id) {
                    e.currentTarget.style.backgroundColor = 'var(--color-surface-variant)'
                  }
                }}
                onMouseLeave={e => {
                  if (value !== team.id) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                <TeamDisplay team={team} size="sm" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function MatchManager() {
  const { matches, createMatch, updateMatch, deleteMatch } = useMatches()
  const { teams, loading: teamsLoading } = useTeams()
  const [formData, setFormData] = useState({
    home_team_id: '',
    away_team_id: '',
    match_date: '',
    round_number: 1,
  })

  const handleSubmit = async e => {
    e.preventDefault()

    if (!formData.home_team_id || !formData.away_team_id) {
      alert('Por favor seleccioná ambos equipos')
      return
    }

    if (formData.home_team_id === formData.away_team_id) {
      alert('Los equipos no pueden ser iguales')
      return
    }

    const matchData = {
      home_team_id: formData.home_team_id,
      away_team_id: formData.away_team_id,
      match_date: new Date(formData.match_date).toISOString(),
      round_number: formData.round_number,
    }

    const { error } = await createMatch(matchData)

    if (error) {
      alert(`Error: ${error.message}`)
    } else {
      alert('Partido creado!')
      setFormData({
        home_team_id: '',
        away_team_id: '',
        match_date: '',
        round_number: formData.round_number,
      })
    }
  }

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
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h2
          style={{
            fontSize: '1.75rem',
            fontWeight: '700',
            color: 'var(--color-primary)',
            marginBottom: '8px',
          }}
        >
          ⚙️ Administrar Partidos
        </h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Creá y gestioná los partidos del torneo
        </p>
      </div>

      {/* Formulario para crear partido */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3
          style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: 'var(--color-text-primary)',
            marginBottom: '20px',
          }}
        >
          ➕ Crear Nuevo Partido
        </h3>
        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
        >
          <div className="grid grid-cols-2" style={{ gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">🏠 Equipo Local</label>
              {teamsLoading ? (
                <div
                  style={{
                    padding: '12px',
                    textAlign: 'center',
                    color: 'var(--color-text-secondary)',
                    backgroundColor: 'var(--color-surface-variant)',
                    borderRadius: '8px',
                  }}
                >
                  Cargando equipos...
                </div>
              ) : (
                <TeamSelect
                  value={formData.home_team_id}
                  onChange={teamId => setFormData({ ...formData, home_team_id: teamId })}
                  teams={teams}
                  placeholder="Seleccioná un equipo"
                  disabled={false}
                />
              )}
            </div>
            <div className="form-group">
              <label className="form-label">✈️ Equipo Visitante</label>
              {teamsLoading ? (
                <div
                  style={{
                    padding: '12px',
                    textAlign: 'center',
                    color: 'var(--color-text-secondary)',
                    backgroundColor: 'var(--color-surface-variant)',
                    borderRadius: '8px',
                  }}
                >
                  Cargando equipos...
                </div>
              ) : (
                <TeamSelect
                  value={formData.away_team_id}
                  onChange={teamId => setFormData({ ...formData, away_team_id: teamId })}
                  teams={teams}
                  placeholder="Seleccioná un equipo"
                  disabled={false}
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2" style={{ gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">📅 Fecha y Hora</label>
              <input
                type="datetime-local"
                value={formData.match_date}
                onChange={e => setFormData({ ...formData, match_date: e.target.value })}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">🔢 Número de Fecha</label>
              <input
                type="number"
                value={formData.round_number}
                onChange={e =>
                  setFormData({
                    ...formData,
                    round_number: parseInt(e.target.value),
                  })
                }
                className="form-input"
                min="1"
                placeholder="1"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%' }}
            disabled={teamsLoading}
          >
            ➕ Crear Partido
          </button>
        </form>
      </div>

      {/* Lista de partidos */}
      <div className="card">
        <h3
          style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: 'var(--color-text-primary)',
            marginBottom: '20px',
          }}
        >
          📋 Partidos Creados
        </h3>

        {!matches || matches.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚽</div>
            <p style={{ color: 'var(--color-text-secondary)' }}>No hay partidos creados todavía</p>
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
                      📅 Fecha {match.round_number} -{' '}
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
                    {!match.is_finished && (
                      <button
                        onClick={() => handleUpdateResult(match.id)}
                        className="btn-success"
                        style={{ flex: '1', minWidth: '200px' }}
                      >
                        ⚽ Cargar Resultado
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm('¿Eliminar partido?')) {
                          deleteMatch(match.id)
                        }
                      }}
                      className="btn-error"
                      style={{ flex: match.is_finished ? '1' : '0', minWidth: '140px' }}
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
