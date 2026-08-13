import { useMemo } from 'react'
import { usePlayoffs } from '../../hooks/usePlayoffs'
import { useTournament } from '../../contexts/TournamentContext'
import PlayoffBracket from './PlayoffBracket'
import LoadingState from '../Common/LoadingState'
import EmptyState from '../Common/EmptyState'

export default function Playoffs() {
  const { activeTournament } = useTournament()
  const { matchesByStage, predictions, loading, error, hasAnyPlayoffMatches } = usePlayoffs(
    activeTournament?.id
  )

  const predictionsByMatch = useMemo(() => {
    const map = {}
    ;(predictions || []).forEach(prediction => {
      map[prediction.match_id] = prediction
    })
    return map
  }, [predictions])

  if (loading) {
    return (
      <div className="container" style={{ maxWidth: '1200px' }}>
        <LoadingState message="Cargando playoffs..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container" style={{ maxWidth: '1200px' }}>
        <EmptyState icon="⚠️" title="No se pudieron cargar los playoffs" description={error} />
      </div>
    )
  }

  if (!hasAnyPlayoffMatches) {
    return (
      <div className="container" style={{ maxWidth: '1200px' }}>
        <EmptyState
          icon="🥊"
          title="Aún no hay cruces"
          description="Cuando se carguen partidos playoff aparecerán acá en formato llave."
        />
      </div>
    )
  }

  return (
    <div className="container" style={{ maxWidth: '1200px' }}>
      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <h2
          style={{
            fontWeight: '700',
            color: 'var(--color-primary)',
            margin: '0 0 var(--space-xs) 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-sm)',
            fontSize: 'var(--font-size-2xl)',
          }}
        >
          <span>🥊</span>
          <span>Llave de Playoffs</span>
        </h2>
        <p
          style={{
            margin: 0,
            textAlign: 'center',
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--font-size-md)',
          }}
        >
          Seguimiento completo de cruces: confirmados, pendientes y camino a la final.
        </p>
      </div>

      <PlayoffBracket matchesByStage={matchesByStage} predictionsByMatch={predictionsByMatch} />
    </div>
  )
}
