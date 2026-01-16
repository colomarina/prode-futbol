// MatchPrediction.jsx
import { useState, useMemo } from 'react'

export default function MatchPrediction({ match, createPrediction, updatePrediction, predictions }) {
  const existingPrediction = useMemo(() => {
    return predictions?.find(p => p.match_id === match.id)
  }, [predictions, match.id])

  const [homeScore, setHomeScore] = useState(existingPrediction?.home_prediction || 0)
  const [awayScore, setAwayScore] = useState(existingPrediction?.away_prediction || 0)
  const [saving, setSaving] = useState(false)

  const canPredict = (matchDate) => {
    const cutoffTime = new Date(new Date(matchDate).getTime() - 60 * 60 * 1000)
    return new Date() < cutoffTime
  }

  const canPredictMatch = canPredict(match.match_date)

  const handleSavePrediction = async () => {
    setSaving(true)
    let result

    if (existingPrediction) {
      result = await updatePrediction(existingPrediction.id, homeScore, awayScore)
    } else {
      result = await createPrediction(match.id, homeScore, awayScore)
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
    month: 'short'
  })
  const formattedTime = matchDate.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit'
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
      <div style={{ marginBottom: '16px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gap: '12px',
          alignItems: 'center'
        }}>
          {/* Home Team */}
          <div style={{ textAlign: 'right' }}>
            <p style={{
              fontWeight: '700',
              fontSize: '1.1rem',
              color: 'var(--color-text-primary)',
              wordBreak: 'break-word'
            }}>
              {match.home_team}
            </p>
          </div>

          {/* Score Inputs */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            justifyContent: 'center'
          }}>
            <input
              type="number"
              value={homeScore}
              onChange={(e) => setHomeScore(Math.max(0, parseInt(e.target.value) || 0))}
              disabled={!canPredictMatch || match.is_finished}
              style={{
                width: '56px',
                padding: '12px 8px',
                textAlign: 'center',
                fontSize: '1.5rem',
                fontWeight: '700',
                borderRadius: '8px',
                border: '2px solid var(--color-primary)',
                backgroundColor: !canPredictMatch || match.is_finished ? '#FAFAFA' : 'var(--color-surface)',
                color: 'var(--color-primary)',
                minHeight: 'auto'
              }}
              min="0"
            />
            <span style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: 'var(--color-text-secondary)'
            }}>
              -
            </span>
            <input
              type="number"
              value={awayScore}
              onChange={(e) => setAwayScore(Math.max(0, parseInt(e.target.value) || 0))}
              disabled={!canPredictMatch || match.is_finished}
              style={{
                width: '56px',
                padding: '12px 8px',
                textAlign: 'center',
                fontSize: '1.5rem',
                fontWeight: '700',
                borderRadius: '8px',
                border: '2px solid var(--color-primary)',
                backgroundColor: !canPredictMatch || match.is_finished ? '#FAFAFA' : 'var(--color-surface)',
                color: 'var(--color-primary)',
                minHeight: 'auto'
              }}
              min="0"
            />
          </div>

          {/* Away Team */}
          <div style={{ textAlign: 'left' }}>
            <p style={{
              fontWeight: '700',
              fontSize: '1.1rem',
              color: 'var(--color-text-primary)',
              wordBreak: 'break-word'
            }}>
              {match.away_team}
            </p>
          </div>
        </div>
      </div>

      {/* Match Result and Points */}
      {match.is_finished && (
        <div className="alert alert-success" style={{ marginBottom: '12px' }}>
          <div>
            <p style={{ fontWeight: '600', marginBottom: '4px' }}>
              ⚽ Resultado Final: {match.home_score} - {match.away_score}
            </p>
            {existingPrediction && (
              <p style={{
                fontWeight: '700',
                fontSize: '1.1rem',
                color: existingPrediction.points > 0 ? 'var(--color-success)' : 'var(--color-error)'
              }}>
                {existingPrediction.points > 0 ? '✅' : '❌'} Puntos: {existingPrediction.points || 0}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Warnings and Actions */}
      {!canPredictMatch && !match.is_finished && (
        <div className="alert alert-warning" style={{ marginBottom: '12px' }}>
          ⏰ Ya no se pueden cargar pronósticos para este partido
        </div>
      )}

      {canPredictMatch && !match.is_finished && (
        <button
          onClick={handleSavePrediction}
          disabled={saving}
          className="btn-primary"
          style={{ width: '100%' }}
        >
          {saving ? '💾 Guardando...' : existingPrediction ? '💾 Actualizar Pronóstico' : '💾 Guardar Pronóstico'}
        </button>
      )}

      {existingPrediction && canPredictMatch && !match.is_finished && (
        <p style={{
          textAlign: 'center',
          marginTop: '8px',
          fontSize: '0.85rem',
          color: 'var(--color-text-secondary)'
        }}>
          Ya tenés un pronóstico guardado. Podés modificarlo.
        </p>
      )}
    </div>
  )
}
