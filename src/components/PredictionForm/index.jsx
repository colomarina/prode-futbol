import { useState, useEffect, useCallback, useMemo } from 'react'
import { useMatches } from '../../hooks/useMatches'
import { usePredictions } from '../../hooks/usePredictions'
import { useRounds } from '../../hooks/useRounds'
import { useAuth } from '../../contexts/AuthContext'
import { useTournament } from '../../contexts/TournamentContext'
import { supabase } from '../../lib/supabase'
import MatchPrediction from './MatchPrediction'
import PaymentReminderModal from '../Common/PaymentReminderModal'
import Toast from '../Common/Toast'
import SelectDropdown from '../Common/SelectDropdown'
import LoadingState from '../Common/LoadingState'
import EmptyState from '../Common/EmptyState'
import { getRoundDisplayName, getRoundDisplayNameByNumber } from '../../utils/roundLabels'

export default function PredictionForm() {
  const { activeTournament } = useTournament()
  const { rounds, activeRound, loading: roundsLoading } = useRounds(activeTournament?.id)
  const { user } = useAuth()

  // Inicializar selectedRound con activeRound cuando esté disponible
  const [selectedRound, setSelectedRound] = useState(activeRound?.round_number || null)

  const { matches, loading: matchesLoading } = useMatches(selectedRound, activeTournament?.id)
  const { predictions, batchUpsertPredictions } = usePredictions(selectedRound)

  const [predictionValues, setPredictionValues] = useState({})
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

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
    () =>
      (rounds || [])
        .filter(r => ['open', 'locked', 'finished'].includes(r.status))
        .sort((a, b) => b.round_number - a.round_number),
    [rounds]
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

  // Auto-seleccionar la fecha activa (open) al cargar, o la más nueva si no hay ninguna activa
  useEffect(() => {
    if (selectedRound) return

    if (availableRounds.length) {
      const roundToSelect = activeRound ?? availableRounds[0]
      if (roundToSelect) {
        setSelectedRound(roundToSelect.round_number)
      }
    }
  }, [activeRound, availableRounds, selectedRound])

  // Verificar si debe mostrarse el recordatorio de pago
  useEffect(() => {
    if (!isRoundOpen || !selectedRound || !user?.id) {
      setShowPaymentModal(false)
      return
    }

    // Si marcó "Recordarme después" en esta sesión, no insistir
    const laterStatus = sessionStorage.getItem(`payment_reminder_round_${selectedRound}`)
    if (laterStatus === 'later') {
      setShowPaymentModal(false)
      return
    }

    let isCancelled = false

    const checkPaymentStatus = async () => {
      try {
        const { data, error } = await supabase.rpc('get_my_round_payment_status', {
          p_round_number: selectedRound,
        })

        if (error) throw error

        // Si ya está pagada según admin/sistema, no mostrar más la modal
        if (!isCancelled) {
          setShowPaymentModal(data !== true)
        }
      } catch {
        // Si falla la verificación, mostrar recordatorio para no perder el aviso
        if (!isCancelled) {
          setShowPaymentModal(true)
        }
      }
    }

    checkPaymentStatus()

    return () => {
      isCancelled = true
    }
  }, [isRoundOpen, selectedRound, user?.id])

  const handleClosePaymentModal = useCallback(() => {
    if (selectedRound) {
      sessionStorage.setItem(`payment_reminder_round_${selectedRound}`, 'later')
    }
    setShowPaymentModal(false)
  }, [selectedRound])

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
            onSelect={setSelectedRound}
            valueKey="round_number"
            placeholder="Seleccionar fecha..."
            renderButton={round => (
              <span style={{ fontWeight: '600' }}>
                {getRoundDisplayName(round)}{' '}
                {round.status === 'open'
                  ? '(Abierta ✅)'
                  : round.status === 'finished'
                    ? '(Finalizada 🏁)'
                    : '(En juego ⚽)'}
              </span>
            )}
            renderOption={round => (
              <span style={{ flex: 1, fontWeight: '600' }}>
                {getRoundDisplayName(round)}{' '}
                {round.status === 'open'
                  ? '(Abierta ✅)'
                  : round.status === 'finished'
                    ? '(Finalizada 🏁)'
                    : '(En juego ⚽)'}
              </span>
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
            setSelectedRound(roundNumber)
            setPredictionValues({}) // Limpiar valores al cambiar de fecha
          }}
          valueKey="round_number"
          placeholder="Seleccionar fecha..."
          renderButton={round => (
            <span style={{ fontWeight: '600' }}>
              {getRoundDisplayName(round)}{' '}
              {round.status === 'open'
                ? '(Abierta ✅)'
                : round.status === 'finished'
                  ? '(Finalizada 🏁)'
                  : '(En juego ⚽)'}
            </span>
          )}
          renderOption={round => (
            <span style={{ flex: 1, fontWeight: '600' }}>
              {getRoundDisplayName(round)}{' '}
              {round.status === 'open'
                ? '(Abierta ✅)'
                : round.status === 'finished'
                  ? '(Finalizada 🏁)'
                  : '(En juego ⚽)'}
            </span>
          )}
        />
      </div>

      {/* Header con estado de la fecha */}
      <div style={{ marginBottom: '16px', textAlign: 'center' }}>
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
            width: '100%',
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
            isRoundOpen={isRoundOpen}
            predictionValue={predictionValues[match.id]}
            existingPrediction={predictionsByMatchId.get(match.id)}
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

      {/* Payment Reminder Modal */}
      <PaymentReminderModal
        isOpen={showPaymentModal}
        onClose={handleClosePaymentModal}
        roundNumber={selectedRound}
      />
    </div>
  )
}
