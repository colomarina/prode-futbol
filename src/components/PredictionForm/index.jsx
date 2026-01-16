import { useMatches } from '../../hooks/useMatches'
import { usePredictions } from '../../hooks/usePredictions'
import MatchPrediction from './MatchPrediction'

export default function PredictionForm({ roundNumber = 1 }) {
  const { matches, loading: matchesLoading } = useMatches(roundNumber)
  const { predictions, createPrediction, updatePrediction } = usePredictions(roundNumber)

  if (matchesLoading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '48px 16px' }}>
        <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
        <p style={{ color: 'var(--color-text-secondary)' }}>Cargando partidos...</p>
      </div>
    )
  }

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

  return (
    <div className="container" style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-primary)', marginBottom: '8px' }}>
          Pronósticos - Fecha {roundNumber}
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
          Cargá tus pronósticos antes de que empiece cada partido
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {matches.map((match) => (
          <MatchPrediction
            key={match.id}
            match={match}
            createPrediction={createPrediction}
            updatePrediction={updatePrediction}
            predictions={predictions}
          />
        ))}
      </div>
    </div>
  )
}
