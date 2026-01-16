import { useState } from 'react'
import { useMatches } from '../../hooks/useMatches'

export default function MatchManager() {
  const { matches, createMatch, updateMatch, deleteMatch } = useMatches()
  const [formData, setFormData] = useState({
    home_team: '',
    away_team: '',
    match_date: '',
    round_number: 1,
  })

  const handleSubmit = async (e) => {
    e.preventDefault()

    const matchData = {
      ...formData,
      match_date: new Date(formData.match_date).toISOString(),
    }

    const { error } = await createMatch(matchData)

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Partido creado!')
      setFormData({
        home_team: '',
        away_team: '',
        match_date: '',
        round_number: formData.round_number,
      })
    }
  }

  const handleUpdateResult = async (matchId) => {
    const homeScore = prompt('Goles Local:')
    const awayScore = prompt('Goles Visitante:')

    if (homeScore !== null && awayScore !== null) {
      const { error } = await updateMatch(matchId, {
        home_score: parseInt(homeScore),
        away_score: parseInt(awayScore),
        is_finished: true,
      })

      if (error) {
        alert('Error: ' + error.message)
      } else {
        alert('Resultado actualizado!')
      }
    }
  }

  return (
    <div className="container" style={{ maxWidth: '1000px' }}>
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-primary)', marginBottom: '8px' }}>
          ⚙️ Administrar Partidos
        </h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Creá y gestioná los partidos del torneo
        </p>
      </div>

      {/* Formulario para crear partido */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '20px' }}>
          ➕ Crear Nuevo Partido
        </h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="grid grid-cols-2" style={{ gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">
                🏠 Equipo Local
              </label>
              <input
                type="text"
                value={formData.home_team}
                onChange={(e) =>
                  setFormData({ ...formData, home_team: e.target.value })
                }
                className="form-input"
                placeholder="Ej: River Plate"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                ✈️ Equipo Visitante
              </label>
              <input
                type="text"
                value={formData.away_team}
                onChange={(e) =>
                  setFormData({ ...formData, away_team: e.target.value })
                }
                className="form-input"
                placeholder="Ej: Boca Juniors"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2" style={{ gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">
                📅 Fecha y Hora
              </label>
              <input
                type="datetime-local"
                value={formData.match_date}
                onChange={(e) =>
                  setFormData({ ...formData, match_date: e.target.value })
                }
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                🔢 Número de Fecha
              </label>
              <input
                type="number"
                value={formData.round_number}
                onChange={(e) =>
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
          >
            ➕ Crear Partido
          </button>
        </form>
      </div>

      {/* Lista de partidos */}
      <div className="card">
        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '20px' }}>
          📋 Partidos Creados
        </h3>

        {!matches || matches.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚽</div>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              No hay partidos creados todavía
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {matches.map((match) => (
              <div
                key={match.id}
                style={{
                  border: '2px solid #E0E0E0',
                  borderRadius: '12px',
                  padding: '16px',
                  backgroundColor: match.is_finished ? 'var(--color-surface-variant)' : 'var(--color-surface)',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px',
                      marginBottom: '8px'
                    }}>
                      <p style={{
                        fontWeight: '700',
                        fontSize: '1.1rem',
                        color: 'var(--color-text-primary)'
                      }}>
                        {match.home_team} vs {match.away_team}
                      </p>
                      {match.is_finished && (
                        <span style={{
                          backgroundColor: 'var(--color-success)',
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>
                          ✅ Finalizado
                        </span>
                      )}
                    </div>
                    <p style={{
                      fontSize: '0.9rem',
                      color: 'var(--color-text-secondary)',
                      marginBottom: '4px'
                    }}>
                      📅 Fecha {match.round_number} - {new Date(match.match_date).toLocaleDateString('es-AR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    {match.is_finished && (
                      <p style={{
                        fontSize: '1.1rem',
                        fontWeight: '700',
                        color: 'var(--color-success)',
                        marginTop: '8px'
                      }}>
                        ⚽ Resultado: {match.home_score} - {match.away_score}
                      </p>
                    )}
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap'
                  }}>
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
