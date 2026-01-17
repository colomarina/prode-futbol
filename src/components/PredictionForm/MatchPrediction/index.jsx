// MatchPrediction.jsx
import { useState, useMemo } from 'react'
import TeamDisplay from '../../TeamDisplay'

export default function MatchPrediction({ match, createPrediction, updatePrediction, predictions, isRoundOpen }) {
  const existingPrediction = useMemo(() => {
    return predictions?.find(p => p.match_id === match.id)
  }, [predictions, match.id])

  const initialHomeScore = existingPrediction?.home_prediction?.toString() || ''
  const initialAwayScore = existingPrediction?.away_prediction?.toString() || ''

  const [homeScore, setHomeScore] = useState(initialHomeScore)
  const [awayScore, setAwayScore] = useState(initialAwayScore)
  const [saving, setSaving] = useState(false)

  const canPredict = (matchDate) => {
    const cutoffTime = new Date(new Date(matchDate).getTime() - 60 * 60 * 1000)
    return new Date() < cutoffTime
  }

  // Solo se puede predecir si la fecha está abierta Y falta más de 1 hora para el partido
  const canPredictMatch = isRoundOpen && canPredict(match.match_date)

  const handleInputChange = (value, setter) => {
    // Permitir vacío o solo números
    if (value === '' || /^\d+$/.test(value)) {
      setter(value)
    }
  }

  const handleSavePrediction = async () => {
    // Convertir a números, usando 0 si está vacío
    const home = homeScore === '' ? 0 : parseInt(homeScore)
    const away = awayScore === '' ? 0 : parseInt(awayScore)

    setSaving(true)
    let result

    if (existingPrediction) {
      result = await updatePrediction(existingPrediction.id, home, away)
    } else {
      result = await createPrediction(match.id, home, away)
    }

    if (result.error) {
      alert('Error: ' + result.error.message || result.error)
    } else {
      alert('Predicción guardada!')
    }
    setSaving(false)
  }

  const matchDate = new Date(match.match_date)
  const formattedDate = matchDate.toLocaleDateString('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'America/Argentina/Buenos_Aires'
  })
  const formattedTime = matchDate.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Argentina/Buenos_Aires'
  })

  return (
    <div
      className="card"
      style={{
        opacity: !canPredictMatch && !match.is_finished ? 0.7 : 1,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Match Status Badge */}
      {match.is_finished && (
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          backgroundColor: 'var(--color-success)',
          color: 'white',
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '0.75rem',
          fontWeight: '600'
        }}>
          Finalizado
        </div>
      )}

      {/* Match Date and Time */}
      <div style={{
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        <span style={{
          backgroundColor: 'var(--color-surface-variant)',
          padding: '4px 12px',
          borderRadius: '8px',
          fontSize: '0.85rem',
          fontWeight: '600',
          color: 'var(--color-text-secondary)'
        }}>
          📅 {formattedDate}
        </span>
        <span style={{
          backgroundColor: 'var(--color-surface-variant)',
          padding: '4px 12px',
          borderRadius: '8px',
          fontSize: '0.85rem',
          fontWeight: '600',
          color: 'var(--color-text-secondary)'
        }}>
          🕐 {formattedTime}
        </span>
      </div>

      {/* Teams and Score */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {/* Home Team Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: '16px',
            alignItems: 'center'
          }}>
            <TeamDisplay team={match.home_team} size="md" />
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              value={homeScore}
              onChange={(e) => handleInputChange(e.target.value, setHomeScore)}
              onFocus={(e) => e.target.select()}
              disabled={!canPredictMatch || match.is_finished}
              placeholder="0"
              style={{
                width: '64px',
                padding: '14px 12px',
                textAlign: 'center',
                fontSize: '1.75rem',
                fontWeight: '700',
                borderRadius: '12px',
                border: '3px solid var(--color-primary)',
                backgroundColor: !canPredictMatch || match.is_finished ? '#FAFAFA' : 'var(--color-surface)',
                color: 'var(--color-primary)',
                outline: 'none',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}
            />
          </div>

          {/* VS Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              flex: 1,
              height: '2px',
              background: 'linear-gradient(to right, transparent, #E0E0E0, transparent)'
            }} />
            <span style={{
              fontSize: '1rem',
              fontWeight: '700',
              color: 'var(--color-text-secondary)',
              padding: '4px 12px',
              backgroundColor: 'var(--color-surface-variant)',
              borderRadius: '8px'
            }}>VS</span>
            <div style={{
              flex: 1,
              height: '2px',
              background: 'linear-gradient(to right, transparent, #E0E0E0, transparent)'
            }} />
          </div>

          {/* Away Team Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: '16px',
            alignItems: 'center'
          }}>
            <TeamDisplay team={match.away_team} size="md" />
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              value={awayScore}
              onChange={(e) => handleInputChange(e.target.value, setAwayScore)}
              onFocus={(e) => e.target.select()}
              disabled={!canPredictMatch || match.is_finished}
              placeholder="0"
              style={{
                width: '64px',
                padding: '14px 12px',
                textAlign: 'center',
                fontSize: '1.75rem',
                fontWeight: '700',
                borderRadius: '12px',
                border: '3px solid var(--color-primary)',
                backgroundColor: !canPredictMatch || match.is_finished ? '#FAFAFA' : 'var(--color-surface)',
                color: 'var(--color-primary)',
                outline: 'none',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}
            />
          </div>
        </div>
      </div>

      {/* Match Result and Points */}
      {match.is_finished && (
        <div style={{
          backgroundColor: existingPrediction?.points > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `2px solid ${existingPrediction?.points > 0 ? '#10b981' : '#ef4444'}`,
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <p style={{
                fontWeight: '600',
                marginBottom: '4px',
                color: 'var(--color-text-primary)',
                fontSize: '0.95rem'
              }}>
                ⚽ Resultado Final: <span style={{ fontSize: '1.2rem', fontWeight: '700' }}>{match.home_score} - {match.away_score}</span>
              </p>
              {existingPrediction && (
                <p style={{
                  fontSize: '0.85rem',
                  color: 'var(--color-text-secondary)',
                  marginTop: '4px'
                }}>
                  Tu pronóstico: {existingPrediction.home_prediction} - {existingPrediction.away_prediction}
                </p>
              )}
            </div>
            {existingPrediction && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: existingPrediction.points > 0 ? '#10b981' : '#ef4444',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '1.1rem'
              }}>
                <span style={{ fontSize: '1.5rem' }}>{existingPrediction.points > 0 ? '✅' : '❌'}</span>
                <span>{existingPrediction.points || 0} pts</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Warnings and Actions */}
      {!isRoundOpen && !match.is_finished && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '2px solid #ef4444',
          borderRadius: '12px',
          padding: '12px 16px',
          marginBottom: '12px',
          textAlign: 'center',
          color: '#dc2626',
          fontWeight: '600',
          fontSize: '0.9rem'
        }}>
          🔒 La fecha está cerrada, no se pueden cargar pronósticos
        </div>
      )}

      {isRoundOpen && !canPredict(match.match_date) && !match.is_finished && (
        <div style={{
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          border: '2px solid #f59e0b',
          borderRadius: '12px',
          padding: '12px 16px',
          marginBottom: '12px',
          textAlign: 'center',
          color: '#d97706',
          fontWeight: '600',
          fontSize: '0.9rem'
        }}>
          ⏰ Ya no se pueden cargar pronósticos para este partido
        </div>
      )}

      {canPredictMatch && !match.is_finished && (
        <>
          <button
            onClick={handleSavePrediction}
            disabled={saving || homeScore === '' || awayScore === ''}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '1rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: (saving || homeScore === '' || awayScore === '') ? 0.6 : 1,
              cursor: (saving || homeScore === '' || awayScore === '') ? 'not-allowed' : 'pointer'
            }}
          >
            <span style={{ fontSize: '1.3rem' }}>
              {saving ? '⏳' : existingPrediction ? '🔄' : '💾'}
            </span>
            <span>
              {saving ? 'Guardando...' : existingPrediction ? 'Actualizar Pronóstico' : 'Guardar Pronóstico'}
            </span>
          </button>
          {existingPrediction && (
            <p style={{
              textAlign: 'center',
              marginTop: '12px',
              fontSize: '0.85rem',
              color: 'var(--color-text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}>
              <span>✓</span>
              <span>Ya tenés un pronóstico guardado</span>
            </p>
          )}
        </>
      )}
    </div>
  )
}
