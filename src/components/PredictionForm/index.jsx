import { useState, useEffect, useCallback, useMemo } from 'react'
import { useMatches } from '../../hooks/useMatches'
import { usePredictions } from '../../hooks/usePredictions'
import { useRounds } from '../../hooks/useRounds'
import { useSelectedRound } from '../../hooks/useSelectedRound'
import { useTournament } from '../../contexts/TournamentContext'
import MatchPrediction from './MatchPrediction'
import ActiveRoundShortcut from './ActiveRoundShortcut'
import LockedRoundNotice from './LockedRoundNotice'
import RoundSelector from './RoundSelector'
import RoundSummary from './RoundSummary'
import Button from '../Common/Button'
import Toast from '../Common/Toast'
import LoadingState from '../Common/LoadingState'
import EmptyState from '../Common/EmptyState'
import { canPredictMatch } from '../../utils/matchTiming'
import { getFormPlaceholder } from './formPlaceholder'
import { collectPredictionsToSave, findExpiredPredictions, getSaveToast } from './savePredictions'
import styles from './PredictionForm.module.css'

/**
 * El formulario de pronósticos de una fecha.
 *
 * Quedó como orquestador: qué fecha se está mirando lo decide
 * `hooks/useSelectedRound`, qué se guarda y qué toast se muestra sale de
 * `savePredictions.js`, y las pantallas de espera de `formPlaceholder.js`. Acá
 * queda el estado de lo tipeado, que es lo único que de verdad vive en la
 * pantalla.
 */
export default function PredictionForm() {
  const { activeTournament, isReadOnly } = useTournament()
  const { rounds, activeRound, loading: roundsLoading } = useRounds(activeTournament?.id)

  const { selectedRound, availableRounds, selectRound, followActiveRound } = useSelectedRound({
    tournamentId: activeTournament?.id,
    rounds,
    activeRound,
    loading: roundsLoading,
  })

  const { matches, loading: matchesLoading } = useMatches(selectedRound, activeTournament?.id)
  const { predictions, batchUpsertPredictions } = usePredictions(
    selectedRound,
    activeTournament?.id
  )

  const [predictionValues, setPredictionValues] = useState({})
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  // Los valores tipeados se indexan por match_id, así que al cambiar de torneo son
  // de partidos que ya no están en pantalla.
  useEffect(() => {
    setPredictionValues({})
  }, [activeTournament?.id])

  const predictionsByMatchId = useMemo(() => {
    if (!predictions?.length) return new Map()
    return new Map(predictions.map(prediction => [prediction.match_id, prediction]))
  }, [predictions])

  const currentRound = useMemo(
    () => rounds?.find(r => r.round_number === selectedRound),
    [rounds, selectedRound]
  )

  const hasEditableMatches = useMemo(
    () => !isReadOnly && matches.some(match => canPredictMatch(match.match_date)),
    [matches, isReadOnly]
  )

  const allMatchesLocked = useMemo(
    () => matches.length > 0 && matches.every(match => !canPredictMatch(match.match_date)),
    [matches]
  )

  /**
   * Si hay algo para guardar, o sea si el botón se habilita. El payload no se
   * memoiza: entre el último render y el click puede vencer un plazo, y ese
   * partido no tiene que viajar. Se arma dentro del handler.
   */
  const hasPredictionsToSave = useMemo(
    () => collectPredictionsToSave({ matches, predictionValues }).length > 0,
    [matches, predictionValues]
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

  const handleRoundSelect = useCallback(
    roundNumber => {
      selectRound(roundNumber)
      setPredictionValues({}) // Limpiar valores al cambiar de fecha
    },
    [selectRound]
  )

  const handleSaveAll = useCallback(async () => {
    // Guard duro: en un torneo finalizado no se escribe aunque se alcance el handler
    if (isReadOnly) return

    setSaving(true)

    // Las dos listas se arman acá, con el reloj del click: no hay contador en vivo
    // que deshabilite el input cuando se cumple el plazo de un partido.
    const toSave = collectPredictionsToSave({ matches, predictionValues })
    const expired = findExpiredPredictions({ matches, predictionValues, predictionsByMatchId })

    if (toSave.length === 0) {
      setSaving(false)
      setToast(getSaveToast({ savedCount: 0, expiredCount: expired.length }))
      return
    }

    // Una sola llamada batch en lugar de múltiples individuales
    const { error } = await batchUpsertPredictions(toSave)

    setSaving(false)
    setToast(getSaveToast({ savedCount: toSave.length, expiredCount: expired.length, error }))
  }, [matches, predictionValues, predictionsByMatchId, batchUpsertPredictions, isReadOnly])

  const placeholder = getFormPlaceholder({
    roundsLoading,
    rounds,
    matchesLoading,
    selectedRound,
  })

  if (placeholder) {
    return (
      <div className="container">
        {placeholder.type === 'loading' ? (
          <LoadingState message={placeholder.message} />
        ) : (
          <EmptyState title={placeholder.title} description={placeholder.description} />
        )}
      </div>
    )
  }

  // La fecha existe pero todavía no tiene partidos: el selector se muestra igual,
  // para poder irse a otra.
  if (!matches || matches.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptySelectorCard}>
          <RoundSelector
            rounds={availableRounds}
            selectedRound={selectedRound}
            onSelect={selectRound}
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
    <div className={styles.container}>
      <div className={styles.selectorCard}>
        <RoundSelector
          rounds={availableRounds}
          selectedRound={selectedRound}
          onSelect={handleRoundSelect}
        />
      </div>

      <RoundSummary
        round={currentRound}
        isReadOnly={isReadOnly}
        allMatchesLocked={allMatchesLocked}
      />

      {/* En modo consulta no hay fecha abierta a la que ir, se oculta */}
      {!isReadOnly && activeRound && selectedRound !== activeRound.round_number && (
        <ActiveRoundShortcut activeRound={activeRound} rounds={rounds} onGo={followActiveRound} />
      )}

      <div className={styles.matches}>
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

      {hasEditableMatches && (
        <div className={styles.saveBar}>
          <Button
            size="lg"
            fullWidth
            onClick={handleSaveAll}
            disabled={saving || !hasPredictionsToSave}
          >
            <span className={styles.saveIcon}>{saving ? '⏳' : '💾'}</span>
            <span>{saving ? 'Guardando...' : 'Guardar Todos los Pronósticos'}</span>
          </Button>
        </div>
      )}

      {!isReadOnly && allMatchesLocked && <LockedRoundNotice />}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
