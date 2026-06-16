import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useMatches } from '../../hooks/useMatches'
import { usePredictions } from '../../hooks/usePredictions'
import { useRounds } from '../../hooks/useRounds'
import { useTournament } from '../../contexts/TournamentContext'
import MatchPrediction from './MatchPrediction'
import Toast from '../Common/Toast'
import SelectDropdown from '../Common/SelectDropdown'
import LoadingState from '../Common/LoadingState'
import EmptyState from '../Common/EmptyState'
import { getRoundDisplayName, getRoundDisplayNameByNumber } from '../../utils/roundLabels'
import { canPredictMatch } from '../../utils/matchTiming'

export default function PredictionForm() {
  const { activeTournament } = useTournament()
  const { rounds, activeRound, loading: roundsLoading } = useRounds(activeTournament?.id)

  const [selectedRound, setSelectedRound] = useState(activeRound?.round_number || null)

  const { matches, loading: matchesLoading } = useMatches(selectedRound, activeTournament?.id)
  const { predictions, batchUpsertPredictions } = usePredictions(
    selectedRound,
    activeTournament?.id
  )

  const [predictionValues, setPredictionValues] = useState({})
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const hasManualRoundSelection = useRef(false)

  const predictionsByMatchId = useMemo(() => {
    if (!predictions?.length) return new Map()
    return new Map(predictions.map(prediction => [prediction.match_id, prediction]))
  }, [predictions])

  // Obtener info de la fecha seleccionada - DEBE ESTAR ANTES DE LOS RETURNS
  const currentRound = useMemo(
    () => rounds?.find(r => r.round_number === selectedRound),
    [rounds, selectedRound]
  )

  const availableRounds = useMemo(
    () => (rounds || []).slice().sort((a, b) => b.round_number - a.round_number),
    [rounds]
  )

  const hasEditableMatches = useMemo(
    () => matches.some(match => canPredictMatch(match.match_date)),
    [matches]
  )

  const allMatchesLocked = useMemo(
    () => matches.length > 0 && matches.every(match => !canPredictMatch(match.match_date)),
    [matches]
  )

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
    const editableMatches = matches.filter(match => canPredictMatch(match.match_date))

    const predictionsData = editableMatches
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
          qualifierPredictionId: values.qualifier || null,
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
    () =>
      matches.some(match => {
        if (!canPredictMatch(match.match_date)) return false

        const values = predictionValues[match.id]
        return values?.home && values?.away
      }),
    [matches, predictionValues]
  )

  useEffect(() => {
    setSelectedRound(null)
    setPredictionValues({})
    hasManualRoundSelection.current = false
  }, [activeTournament?.id])

  useEffect(() => {
    if (availableRounds.length === 0) return

    if (activeRound && !hasManualRoundSelection.current) {
      if (selectedRound !== activeRound.round_number) {
        setSelectedRound(activeRound.round_number)
      }
      return
    }

    if (!selectedRound) {
      setSelectedRound(availableRounds[0].round_number)
    }
  }, [activeRound, availableRounds, selectedRound])

  // Mientras carga la información de fechas o se está auto-seleccionando
  if (roundsLoading) {
    return (
      <div className="container">
        <LoadingState message="Cargando información..." />
      </div>
    )
  }

  // Si no hay fechas en absoluto
  if (!rounds || rounds.length === 0) {
    return (
      <div className="container">
        <EmptyState
          title="No hay fechas disponibles"
          description="Esperá a que el administrador cree las fechas del torneo"
        />
      </div>
    )
  }

  // Mientras cargan los partidos
  if (matchesLoading) {
    return (
      <div className="container">
        <LoadingState message="Cargando partidos..." />
      </div>
    )
  }

  // No renderizar hasta que haya una fecha seleccionada
  if (!selectedRound) {
    return (
      <div className="container">
        <LoadingState message="Preparando información..." />
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
          <SelectDropdown
            items={availableRounds}
            selectedId={selectedRound}
            onSelect={roundNumber => {
              hasManualRoundSelection.current = true
              setSelectedRound(roundNumber)
            }}
            valueKey="round_number"
            placeholder="Seleccionar fecha..."
            renderButton={round => (
              <span style={{ fontWeight: '600' }}>{getRoundDisplayName(round)}</span>
            )}
            renderOption={round => (
              <span style={{ flex: 1, fontWeight: '600' }}>{getRoundDisplayName(round)}</span>
            )}
          />
        </div>

        <EmptyState
          title="No hay partidos disponibles"
          description="Todavía no se cargaron partidos para esta fecha."
        />
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
        <SelectDropdown
          items={availableRounds}
          selectedId={selectedRound}
          onSelect={roundNumber => {
            hasManualRoundSelection.current = true
            setSelectedRound(roundNumber)
            setPredictionValues({}) // Limpiar valores al cambiar de fecha
          }}
          valueKey="round_number"
          placeholder="Seleccionar fecha..."
          renderButton={round => (
            <span style={{ fontWeight: '600' }}>{getRoundDisplayName(round)}</span>
          )}
          renderOption={round => (
            <span style={{ flex: 1, fontWeight: '600' }}>{getRoundDisplayName(round)}</span>
          )}
        />
      </div>

      {/* Resumen de la fecha */}
      <div style={{ marginBottom: '16px', textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            padding: '16px 24px',
            borderRadius: '12px',
            backgroundColor: 'var(--color-surface-variant)',
            border: '2px solid var(--color-border)',
            width: '100%',
          }}
        >
          <span
            style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--color-text-primary)' }}
          >
            {currentRound ? getRoundDisplayName(currentRound) : 'Fecha seleccionada'}
          </span>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            {allMatchesLocked
              ? 'Todos los partidos de esta fecha ya superaron el límite de edición: podés cargar pronósticos hasta 10 minutos antes del horario de cada partido.'
              : 'Todavía podés cargar y actualizar pronósticos en los partidos que sigan habilitados. El límite es 10 minutos antes del horario de cada partido.'}
          </p>
        </div>
      </div>

      {/* Atajo a fecha activa */}
      {activeRound && selectedRound !== activeRound.round_number && (
        <div
          style={{
            background: 'var(--color-surface-highlight)',
            border: '2px solid var(--color-success)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            textAlign: 'center',
          }}
        >
          <p style={{ color: 'var(--color-success)', fontWeight: '600', marginBottom: '8px' }}>
            💡 {getRoundDisplayName(activeRound)} está abierta para pronósticos
          </p>
          <button
            onClick={() => setSelectedRound(activeRound.round_number)}
            className="btn-success"
            style={{ padding: '8px 16px', fontSize: '0.9rem' }}
          >
            Ir a {getRoundDisplayNameByNumber(activeRound.round_number, rounds)} →
          </button>
        </div>
      )}

      {/* Lista de partidos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {matches.map(match => (
          <MatchPrediction
            key={`${match.round_number}-${match.match_number}-${match.id}`}
            match={match}
            predictionValue={predictionValues[match.id]}
            existingPrediction={predictionsByMatchId.get(match.id)}
            onValueChange={handleValueChange}
          />
        ))}
      </div>

      {/* Botón único para guardar todos */}
      {hasEditableMatches && (
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

      {/* Mensaje cuando todos los partidos ya pasaron el cutoff */}
      {allMatchesLocked && (
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
            ⚽ Esta fecha ya pasó su ventana de edición. Los pronósticos que no estén guardados ya
            no se pueden modificar.
          </p>
        </div>
      )}

      {/* Toast notifications */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
