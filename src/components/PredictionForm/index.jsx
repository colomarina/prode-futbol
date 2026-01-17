import { useMatches } from '../../hooks/useMatches'
import { usePredictions } from '../../hooks/usePredictions'
import { useRounds } from '../../hooks/useRounds'
import MatchPrediction from './MatchPrediction'

export default function PredictionForm() {
  const { activeRound, canPredictRound, loading: roundsLoading } = useRounds()
  const { matches, loading: matchesLoading } = useMatches(activeRound?.round_number)
  const { predictions, createPrediction, updatePrediction } = usePredictions(activeRound?.round_number)

  // Mientras carga la información de fechas
  if (roundsLoading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '48px 16px' }}>
        <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
        <p style={{ color: 'var(--color-text-secondary)' }}>Cargando información...</p>
      </div>
    )
  }

  // Si no hay fecha activa
  if (!activeRound) {
    return (
      <div className="container" style={{ maxWidth: '600px', textAlign: 'center', padding: '48px 16px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '48px 32px',
          borderRadius: '16px',
          color: 'white',
          boxShadow: '0 10px 40px rgba(102, 126, 234, 0.3)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🔒</div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '12px' }}>
            No hay fechas abiertas
          </h3>
          <p style={{ opacity: 0.9, fontSize: '0.95rem' }}>
            Esperá a que el administrador abra la próxima fecha para cargar tus pronósticos
          </p>
        </div>
      </div>
    )
  }

  // Mientras cargan los partidos
  if (matchesLoading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '48px 16px' }}>
        <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
        <p style={{ color: 'var(--color-text-secondary)' }}>Cargando partidos...</p>
      </div>
    )
  }

  // Si la fecha no tiene partidos
  if (!matches || matches.length === 0) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '48px 16px' }}>
        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>⚽</div>
        <h3 style={{ color: 'var(--color-text-primary)', marginBottom: '8px' }}>
          No hay partidos disponibles
        </h3>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Todavía no se cargaron partidos para esta fecha.
        </p>
      </div>
    )
  }

  // Verificar si la fecha está abierta para predicciones
  const isRoundOpen = canPredictRound(activeRound.round_number)

  return (
    <div className="container" style={{ maxWidth: '900px' }}>
      {/* Header con estado de la fecha */}
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-primary)', margin: 0 }}>
            Pronósticos - Fecha {activeRound.round_number}
          </h2>
          <span style={{
            background: isRoundOpen ? '#10b981' : '#ef4444',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {isRoundOpen ? 'Abierta' : 'Cerrada'}
          </span>
        </div>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
          {isRoundOpen
            ? 'Cargá tus pronósticos antes de que empiece cada partido'
            : 'Esta fecha ya no acepta pronósticos'
          }
        </p>
      </div>

      {/* Alerta si la fecha está cerrada */}
      {!isRoundOpen && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          <p style={{ color: '#dc2626', fontWeight: '500', margin: 0 }}>
            ⚠️ Esta fecha está cerrada. No podés modificar los pronósticos.
          </p>
        </div>
      )}

      {/* Lista de partidos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {matches.map((match) => (
          <MatchPrediction
            key={match.id}
            match={match}
            createPrediction={createPrediction}
            updatePrediction={updatePrediction}
            predictions={predictions}
            isRoundOpen={isRoundOpen}
          />
        ))}
      </div>
    </div>
  )
}
