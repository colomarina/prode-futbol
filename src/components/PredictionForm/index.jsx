import { useState, useEffect } from 'react'
import { useMatches } from '../../hooks/useMatches'
import { usePredictions } from '../../hooks/usePredictions'
import { useRounds } from '../../hooks/useRounds'
import MatchPrediction from './MatchPrediction'

export default function PredictionForm() {
  const { rounds, activeRound, loading: roundsLoading } = useRounds()
  const [selectedRound, setSelectedRound] = useState(null)
  const { matches, loading: matchesLoading } = useMatches(selectedRound)
  const { predictions, createPrediction, updatePrediction } = usePredictions(selectedRound)

  const [predictionValues, setPredictionValues] = useState({})
  const [saving, setSaving] = useState(false)

  // Auto-seleccionar la fecha activa al cargar
  useEffect(() => {
    if (!selectedRound && rounds && rounds.length > 0) {
      // Filtrar fechas válidas
      const validRounds = rounds.filter(r => ['open', 'locked', 'finished'].includes(r.status))

      if (validRounds.length > 0) {
        // Prioridad: fecha activa > primera fecha válida
        if (activeRound && ['open', 'locked', 'finished'].includes(activeRound.status)) {
          setSelectedRound(activeRound.round_number)
        } else {
          setSelectedRound(validRounds[0].round_number)
        }
      }
    }
  }, [activeRound, selectedRound, rounds])

  // Mientras carga la información de fechas
  if (roundsLoading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '48px 16px' }}>
        <div className="spinner" style={{ margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--color-text-secondary)' }}>Cargando información...</p>
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
        <div className="spinner" style={{ margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--color-text-secondary)' }}>Cargando partidos...</p>
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

  // Obtener info de la fecha seleccionada
  const currentRound = rounds.find(r => r.round_number === selectedRound)
  const isRoundOpen = currentRound?.status === 'open'
  const isRoundFinished = currentRound?.status === 'finished'
  const isRoundLocked = currentRound?.status === 'locked'

  const handleValueChange = (matchId, field, value) => {
    setPredictionValues(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [field]: value,
      },
    }))
  }

  const handleSaveAll = async () => {
    setSaving(true)

    const validMatches = matches.filter(match => {
      const values = predictionValues[match.id]
      return values?.home && values?.away
    })

    const results = await Promise.all(
      validMatches.map(async match => {
        const values = predictionValues[match.id]
        const home = parseInt(values.home, 10)
        const away = parseInt(values.away, 10)

        const existingPrediction = predictions?.find(p => p.match_id === match.id)

        if (existingPrediction) {
          return updatePrediction(existingPrediction.id, home, away)
        }
        return createPrediction(match.id, home, away)
      })
    )

    const successCount = results.filter(result => !result.error).length
    const errorCount = results.filter(result => result.error).length

    setSaving(false)

    if (successCount > 0 && errorCount === 0) {
      alert(`✅ ${successCount} pronóstico(s) guardado(s) correctamente`)
    } else if (successCount > 0 && errorCount > 0) {
      alert(
        `⚠️ ${successCount} pronóstico(s) guardado(s), ${errorCount} fallaron. Revisá los errores.`
      )
    } else if (errorCount > 0) {
      alert(`❌ Error al guardar pronósticos. Intentá de nuevo.`)
    }
  }

  // Verificar si hay al menos un pronóstico para guardar
  const hasValidPredictions = Object.values(predictionValues).some(v => v?.home && v?.away)

  // Obtener estado visual
  const getStatusBadge = () => {
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
  }

  const statusBadge = getStatusBadge()

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
            key={match.id}
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
    </div>
  )
}
