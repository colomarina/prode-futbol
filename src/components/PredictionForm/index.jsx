import { useState, useEffect, useCallback, useMemo } from 'react'
import { useMatches } from '../../hooks/useMatches'
import { usePredictions } from '../../hooks/usePredictions'
import { useRounds } from '../../hooks/useRounds'
import MatchPrediction from './MatchPrediction'
import Toast from '../Toast'

export default function PredictionForm() {
  const { rounds, activeRound, loading: roundsLoading } = useRounds()

  // Inicializar selectedRound con activeRound cuando esté disponible
  const [selectedRound, setSelectedRound] = useState(activeRound?.round_number || null)

  const { matches, loading: matchesLoading } = useMatches(selectedRound)
  const { predictions, batchUpsertPredictions } = usePredictions(selectedRound)

  const [predictionValues, setPredictionValues] = useState({})
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  // Obtener info de la fecha seleccionada - DEBE ESTAR ANTES DE LOS RETURNS
  const currentRound = useMemo(
    () => rounds?.find(r => r.round_number === selectedRound),
    [rounds, selectedRound]
  )

  const isRoundOpen = currentRound?.status === 'open'
  const isRoundFinished = currentRound?.status === 'finished'
  const isRoundLocked = currentRound?.status === 'locked'

  const handleValueChange = useCallback((matchId, field, value) => {
    setPredictionValues(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [field]: value,
      },
    }))
  }, [])

  const handleSaveAll = useCallback(async () => {
    setSaving(true)

    // Preparar datos para batch upsert
    const predictionsData = matches
      .filter(match => {
        const values = predictionValues[match.id]
        return values?.home && values?.away
      })
      .map(match => {
        const values = predictionValues[match.id]
        return {
          matchId: match.id,
          homePrediction: parseInt(values.home, 10),
          awayPrediction: parseInt(values.away, 10),
        }
      })

    if (predictionsData.length === 0) {
      setSaving(false)
      return
    }

    // Una sola llamada batch en lugar de múltiples individuales
    const { error } = await batchUpsertPredictions(predictionsData)

    setSaving(false)

    if (!error) {
      setToast({
        message: `${predictionsData.length} pronóstico${predictionsData.length > 1 ? 's' : ''} guardado${predictionsData.length > 1 ? 's' : ''} correctamente`,
        type: 'success',
      })
    } else {
      setToast({
        message: 'Error al guardar pronósticos. Intentá de nuevo.',
        type: 'error',
      })
    }
  }, [matches, predictionValues, batchUpsertPredictions])

  // Verificar si hay al menos un pronóstico para guardar
  const hasValidPredictions = useMemo(
    () => Object.values(predictionValues).some(v => v?.home && v?.away),
    [predictionValues]
  )

  // Obtener estado visual
  const statusBadge = useMemo(() => {
    if (isRoundOpen) {
      return {
        color: '#10b981',
        text: 'Abierta ✅',
        description: 'Cargá tus pronósticos y guardalos todos al final',
      }
    }
    if (isRoundFinished) {
      return {
        color: '#3b82f6',
        text: 'Finalizada 🏁',
        description: 'Mirá tus resultados y puntos obtenidos',
      }
    }
    return {
      color: '#ef4444',
      text: 'En juego ⚽',
      description: 'Esta fecha está en juego. No se pueden modificar pronósticos.',
    }
  }, [isRoundOpen, isRoundFinished])

  // Auto-seleccionar siempre la ultima fecha disponible al cargar
  useEffect(() => {
    if (selectedRound) return

    if (rounds?.length) {
      const available = rounds.filter(r => ['open', 'locked', 'finished'].includes(r.status))
      const lastAvailable = available.sort((a, b) => b.round_number - a.round_number)[0]
      if (lastAvailable) {
        setSelectedRound(lastAvailable.round_number)
      }
    }
  }, [activeRound, rounds, selectedRound])

  // Mientras carga la información de fechas o se está auto-seleccionando
  if (roundsLoading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '48px 16px' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            margin: '0 auto 20px',
            border: '4px solid rgba(30, 127, 67, 0.1)',
            borderTop: '4px solid var(--color-primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <p
          style={{
            color: 'var(--color-text-secondary)',
            fontSize: '1rem',
            fontWeight: '500',
          }}
        >
          Cargando información...
        </p>
      </div>
    )
  }

  // Si no hay fechas en absoluto
  if (!rounds || rounds.length === 0) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '48px 16px' }}>
        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>⚽</div>
        <h3 style={{ color: 'var(--color-text-primary)', marginBottom: '8px' }}>
          No hay fechas disponibles
        </h3>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Esperá a que el administrador cree las fechas del torneo
        </p>
      </div>
    )
  }

  // Mientras cargan los partidos
  if (matchesLoading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '48px 16px' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            margin: '0 auto 20px',
            border: '4px solid rgba(30, 127, 67, 0.1)',
            borderTop: '4px solid var(--color-primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <p
          style={{
            color: 'var(--color-text-secondary)',
            fontSize: '1rem',
            fontWeight: '500',
          }}
        >
          Cargando partidos...
        </p>
      </div>
    )
  }

  // No renderizar hasta que haya una fecha seleccionada
  if (!selectedRound) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '48px 16px' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            margin: '0 auto 20px',
            border: '4px solid rgba(30, 127, 67, 0.1)',
            borderTop: '4px solid var(--color-primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <p
          style={{
            color: 'var(--color-text-secondary)',
            fontSize: '1rem',
            fontWeight: '500',
          }}
        >
          Preparando información...
        </p>
      </div>
    )
  }

  // Si la fecha no tiene partidos
  if (!matches || matches.length === 0) {
    return (
      <div className="container" style={{ maxWidth: '900px' }}>
        {/* Selector de fechas */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <label className="form-label">📅 Seleccioná una Fecha</label>
          <select
            value={selectedRound || ''}
            onChange={e => setSelectedRound(Number(e.target.value))}
            className="form-input"
          >
            {rounds
              .filter(r => ['open', 'locked', 'finished'].includes(r.status))
              .map(round => (
                <option key={round.id} value={round.round_number}>
                  Fecha {round.round_number}{' '}
                  {round.status === 'open'
                    ? '(Abierta ✅)'
                    : round.status === 'finished'
                      ? '(Finalizada 🏁)'
                      : '(En juego ⚽)'}
                </option>
              ))}
          </select>
        </div>

        <div style={{ textAlign: 'center', padding: '48px 16px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>⚽</div>
          <h3 style={{ color: 'var(--color-text-primary)', marginBottom: '8px' }}>
            No hay partidos disponibles
          </h3>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Todavía no se cargaron partidos para esta fecha.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={{ maxWidth: '900px' }}>
      {/* Selector de fechas */}
      <div className="card" style={{ marginBottom: '16px', padding: '0px' }}>
        <label
          className="form-label"
          style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '12px', display: 'block' }}
        >
          📅 Seleccioná una Fecha
        </label>
        <select
          value={selectedRound || ''}
          onChange={e => {
            setSelectedRound(Number(e.target.value))
            setPredictionValues({}) // Limpiar valores al cambiar de fecha
          }}
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
          {rounds
            .filter(r => ['open', 'locked', 'finished'].includes(r.status))
            .map(round => (
              <option key={round.id} value={round.round_number}>
                Fecha {round.round_number}{' '}
                {round.status === 'open'
                  ? '(Abierta ✅)'
                  : round.status === 'finished'
                    ? '(Finalizada 🏁)'
                    : '(En juego ⚽)'}
              </option>
            ))}
        </select>
      </div>

      {/* Header con estado de la fecha */}
      <div style={{ marginBottom: '16px', textAlign: 'center' }}>
        {/* <h2
          style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: 'var(--color-primary)',
            margin: '0 0 16px 0',
          }}
        >
          Fecha {selectedRound}
        </h2> */}
        <div
          style={{
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            padding: '16px 24px',
            borderRadius: '12px',
            backgroundColor: `${statusBadge.color}15`,
            border: `2px solid ${statusBadge.color}`,
          }}
        >
          <span
            style={{
              background: statusBadge.color,
              color: 'white',
              padding: '6px 16px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {statusBadge.text}
          </span>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            {statusBadge.description}
          </p>
        </div>
      </div>

      {isRoundFinished && (
        <div
          style={{
            background: '#eff6ff',
            border: '2px solid #93c5fd',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            textAlign: 'center',
          }}
        >
          <p style={{ color: '#1e40af', fontWeight: '600', margin: 0 }}>
            🏁 Fecha finalizada. Mirá tus puntos obtenidos en cada partido.
          </p>
        </div>
      )}

      {/* Atajo a fecha activa */}
      {activeRound && selectedRound !== activeRound.round_number && (
        <div
          style={{
            background: '#f0fdf4',
            border: '2px solid #86efac',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            textAlign: 'center',
          }}
        >
          <p style={{ color: '#15803d', fontWeight: '600', marginBottom: '8px' }}>
            💡 La Fecha {activeRound.round_number} está abierta para pronósticos
          </p>
          <button
            onClick={() => setSelectedRound(activeRound.round_number)}
            className="btn-success"
            style={{ padding: '8px 16px', fontSize: '0.9rem' }}
          >
            Ir a Fecha {activeRound.round_number} →
          </button>
        </div>
      )}

      {/* Lista de partidos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {matches.map(match => (
          <MatchPrediction
            key={`${match.round_number}-${match.match_number}-${match.id}`}
            match={match}
            predictions={predictions}
            isRoundOpen={isRoundOpen}
            predictionValues={predictionValues}
            onValueChange={handleValueChange}
          />
        ))}
      </div>

      {/* Botón único para guardar todos - Solo si la fecha está abierta */}
      {isRoundOpen && (
        <div style={{ marginTop: '24px', position: 'sticky', bottom: '20px', zIndex: 10 }}>
          <button
            onClick={handleSaveAll}
            disabled={saving || !hasValidPredictions}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '18px',
              fontSize: '1.1rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              opacity: saving || !hasValidPredictions ? 0.6 : 1,
              cursor: saving || !hasValidPredictions ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>{saving ? '⏳' : '💾'}</span>
            <span>{saving ? 'Guardando...' : 'Guardar Todos los Pronósticos'}</span>
          </button>
        </div>
      )}

      {/* Mensaje cuando la fecha está bloqueada/finalizada */}
      {(isRoundLocked || isRoundFinished) && (
        <div
          style={{
            marginTop: '24px',
            padding: '16px',
            textAlign: 'center',
            backgroundColor: 'var(--color-surface-variant)',
            borderRadius: '12px',
          }}
        >
          <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
            {isRoundFinished
              ? '🏁 Esta fecha ya finalizó. Los resultados están calculados.'
              : '⚽ Esta fecha está en juego. No se pueden modificar pronósticos.'}
          </p>
        </div>
      )}

      {/* Toast notifications */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
