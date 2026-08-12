import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useMatches } from '../../hooks/useMatches'
import { usePredictions } from '../../hooks/usePredictions'
import { useRounds } from '../../hooks/useRounds'
import { useTournament } from '../../contexts/TournamentContext'
import MatchPrediction from './MatchPrediction'
import Button from '../Common/Button'
import Toast from '../Common/Toast'
import SelectDropdown from '../Common/SelectDropdown'
import LoadingState from '../Common/LoadingState'
import EmptyState from '../Common/EmptyState'
import { getRoundDisplayName, getRoundDisplayNameByNumber } from '../../utils/roundLabels'
import { canPredictMatch } from '../../utils/matchTiming'

export default function PredictionForm() {
  const { activeTournament, isReadOnly } = useTournament()
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
    () => !isReadOnly && matches.some(match => canPredictMatch(match.match_date)),
    [matches, isReadOnly]
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
    // Guard duro: en un torneo finalizado no se escribe aunque se alcance el handler
    if (isReadOnly) return

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

    /**
     * Los partidos donde el usuario cambio algo y el plazo vencio antes de que
     * apretara Guardar. El filtro de arriba los descarta, y antes eso pasaba en
     * silencio: si era el unico que habia cargado, apretar Guardar no hacia nada
     * —ni un toast— y quedaba creyendo que se guardo. No hay contador en vivo, asi
     * que el input sigue habilitado hasta que algo dispare un re-render.
     *
     * Se compara contra el pronostico ya guardado y no alcanza con "tiene valores":
     * `MatchPrediction` siembra `predictionValues` con lo que ya estaba guardado
     * (su efecto de "inicializar valores desde prediccion existente"), asi que
     * mirar solo si hay valores contaba partidos que el usuario nunca toco, incluido
     * alguno ya jugado y con resultado cargado.
     */
    const vencidos = matches.filter(match => {
      if (canPredictMatch(match.match_date)) return false

      const values = predictionValues[match.id]
      if (!values?.home || !values?.away) return false

      const guardado = predictionsByMatchId.get(match.id)
      if (!guardado) return true

      return (
        String(guardado.home_prediction) !== String(values.home) ||
        String(guardado.away_prediction) !== String(values.away)
      )
    })

    if (predictionsData.length === 0) {
      setSaving(false)
      setToast(
        vencidos.length > 0
          ? {
              message: `El plazo venció mientras cargabas: ${vencidos.length === 1 ? 'ese pronóstico no se guardó' : `esos ${vencidos.length} pronósticos no se guardaron`}.`,
              type: 'warning',
            }
          : { message: 'No hay pronósticos para guardar', type: 'warning' }
      )
      return
    }

    // Una sola llamada batch en lugar de múltiples individuales
    const { error } = await batchUpsertPredictions(predictionsData)

    setSaving(false)

    if (!error) {
      const guardados = `${predictionsData.length} pronóstico${predictionsData.length > 1 ? 's' : ''} guardado${predictionsData.length > 1 ? 's' : ''} correctamente`

      setToast({
        message:
          vencidos.length > 0
            ? `${guardados}. ${vencidos.length === 1 ? 'Otro quedó' : `Otros ${vencidos.length} quedaron`} afuera porque venció el plazo.`
            : guardados,
        type: vencidos.length > 0 ? 'warning' : 'success',
      })
    } else {
      setToast({
        message: 'Error al guardar pronósticos. Intentá de nuevo.',
        type: 'error',
      })
    }
  }, [matches, predictionValues, predictionsByMatchId, batchUpsertPredictions, isReadOnly])

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
    // Hay que esperar a que `useRounds` termine: `availableRounds` esta ordenado
    // descendente, asi que su primer elemento es la fecha mas alta del torneo. Si
    // las fechas ya llegaron pero los partidos no, `activeRound` todavia es null y
    // este fallback elegia esa ultima fecha, pedia sus partidos y sus pronosticos,
    // y recien despues saltaba a la correcta. El fallback sigue existiendo para el
    // torneo que ya se jugo entero, donde no hay ninguna fecha activa.
    if (roundsLoading) return
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
  }, [activeRound, availableRounds, selectedRound, roundsLoading])

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
          <SelectDropdown
            label="📅 Seleccioná una Fecha"
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
        <SelectDropdown
          label="📅 Seleccioná una Fecha"
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
            {isReadOnly
              ? 'Este torneo ya terminó. Estás viendo el histórico de pronósticos y resultados.'
              : allMatchesLocked
                ? 'Todos los partidos de esta fecha ya superaron el límite de edición: podés cargar pronósticos hasta 10 minutos antes del horario de cada partido.'
                : 'Todavía podés cargar y actualizar pronósticos en los partidos que sigan habilitados. El límite es 10 minutos antes del horario de cada partido.'}
          </p>
        </div>
      </div>

      {/* Atajo a fecha activa - en modo consulta no hay fecha abierta, se oculta */}
      {!isReadOnly && activeRound && selectedRound !== activeRound.round_number && (
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
          <Button
            variant="success"
            size="sm"
            onClick={() => setSelectedRound(activeRound.round_number)}
          >
            Ir a {getRoundDisplayNameByNumber(activeRound.round_number, rounds)} →
          </Button>
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
        <div
          style={{
            marginTop: '24px',
            position: 'sticky',
            bottom: '20px',
            zIndex: 'var(--z-sticky)',
          }}
        >
          <Button
            size="lg"
            fullWidth
            onClick={handleSaveAll}
            disabled={saving || !hasValidPredictions}
          >
            <span style={{ fontSize: 'var(--font-size-2xl)' }}>{saving ? '⏳' : '💾'}</span>
            <span>{saving ? 'Guardando...' : 'Guardar Todos los Pronósticos'}</span>
          </Button>
        </div>
      )}

      {/* Mensaje cuando todos los partidos ya pasaron el cutoff.
          En modo consulta se omite: ya lo dice el resumen de arriba y quedaría duplicado. */}
      {!isReadOnly && allMatchesLocked && (
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
