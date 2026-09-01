import { useState, useEffect, useCallback, useMemo } from 'react'
import type { FormEvent } from 'react'
import { useMatches } from '../../hooks/useMatches'
import { useMatchesMeta } from '../../hooks/useMatchesMeta'
import { usePredictions } from '../../hooks/usePredictions'
import { useRounds } from '../../hooks/useRounds'
import { useSelectedRound } from '../../hooks/useSelectedRound'
import { useTournament } from '../../contexts/TournamentContext'
import MatchPrediction from './MatchPrediction'
import ActiveRoundShortcut from './ActiveRoundShortcut'
import LockedRoundNotice from './LockedRoundNotice'
import RoundSelector from './RoundSelector'
import RoundSummary from './RoundSummary'
import MatchPredictionSkeleton from './MatchPredictionSkeleton'
import Button from '../Common/Button'
import Toast from '../Common/Toast'
import LoadingState from '../Common/LoadingState'
import EmptyState from '../Common/EmptyState'
import { canPredictMatch } from '../../utils/matchTiming'
import { getFormPlaceholder } from './formPlaceholder'
import { collectPredictionsToSave, findExpiredPredictions, getSaveToast } from './savePredictions'
import type { PredictionFormValues } from './savePredictions'
import type { ToastType } from '../Common/Toast'
import type { Uuid } from '../../types/domain'
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
  /*
   * Solo para saber cuántas tarjetas de esqueleto dibujar. Es la consulta compartida
   * de "todos los partidos del torneo", así que a esta altura ya está en cache y no
   * agrega una petición: resuelve antes que la consulta pesada de `useMatches`, que
   * es justo la que estamos esperando.
   */
  const { matchesMeta } = useMatchesMeta(activeTournament?.id)
  const { predictions, batchUpsertPredictions } = usePredictions(
    selectedRound,
    activeTournament?.id
  )

  const [predictionValues, setPredictionValues] = useState<PredictionFormValues>({})
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

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

  const handleValueChange = useCallback(
    (matchId: Uuid, field: 'home' | 'away' | 'qualifier', value: string) => {
      setPredictionValues(prev => ({
        ...prev,
        [matchId]: {
          ...prev[matchId],
          [field]: value,
        },
      }))
    },
    []
  )

  const handleRoundSelect = useCallback(
    (roundNumber: number | null) => {
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

  /**
   * El `<form>` existe para que se pueda guardar con Enter desde cualquier input
   * del marcador, que es como se completa una fecha entera sin soltar el teclado.
   *
   * `preventDefault` porque el guardado es una llamada a Supabase, no un submit
   * HTTP: sin esto el navegador recarga la pagina y se pierde lo tipeado.
   */
  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      handleSaveAll()
    },
    [handleSaveAll]
  )

  const placeholder = getFormPlaceholder({
    roundsLoading,
    rounds,
    matchesLoading,
    selectedRound,
  })

  /** Cuántas tarjetas de esqueleto van, para reservar el alto real y no uno inventado. */
  const cantidadDePartidos = useMemo(
    () => matchesMeta.filter(match => match.round_number === selectedRound).length,
    [matchesMeta, selectedRound]
  )

  /*
   * El esqueleto no es un placeholder de pantalla completa: las fechas ya llegaron,
   * asi que el selector se dibuja igual y solo se reserva el lugar de las tarjetas.
   * Por eso sale antes del `if (placeholder)`, que si reemplaza toda la pantalla.
   */
  if (placeholder?.type === 'skeleton') {
    return (
      <div className={styles.container}>
        <div className={styles.selectorCard}>
          <RoundSelector
            rounds={availableRounds}
            selectedRound={selectedRound}
            onSelect={handleRoundSelect}
          />
        </div>
        <MatchPredictionSkeleton cantidad={cantidadDePartidos} />
      </div>
    )
  }

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
      {/*
       * El form envuelve todo menos el toast, y no solo la lista de partidos: asi
       * su caja coincide con la del contenedor y el `position: sticky` de la barra
       * de guardar sigue teniendo el mismo alto para pegarse.
       */}
      <form onSubmit={handleSubmit} className={styles.form}>
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
            <Button type="submit" size="lg" fullWidth disabled={saving || !hasPredictionsToSave}>
              <span className={styles.saveIcon}>{saving ? '⏳' : '💾'}</span>
              <span>{saving ? 'Guardando...' : 'Guardar Todos los Pronósticos'}</span>
            </Button>
          </div>
        )}

        {!isReadOnly && allMatchesLocked && <LockedRoundNotice />}
      </form>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
