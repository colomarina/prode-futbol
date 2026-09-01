import { useEffect, useCallback, memo, useRef } from 'react'
import TeamDisplay from '../../Common/TeamDisplay'
import ScoreInput, { ScoreSeparator } from '../../Common/ScoreInput'
import { canPredictMatch as canPredictMatchByTime } from '../../../utils/matchTiming'
import { useTournament } from '../../../contexts/TournamentContext'
import MatchHeader from './MatchHeader'
import QualifierPicker from './QualifierPicker'
import MatchOutcome from './MatchOutcome'
import { resolveQualifier, getQualifierToSync } from './qualifier'
import { getMatchWarning, getMatchStatus } from './matchWarnings'
import type { MatchWithTeams, Prediction, TeamSummary, Uuid } from '../../../types/domain'
import type { MatchPredictionValues } from '../savePredictions'
import styles from './MatchPrediction.module.css'

interface MatchPredictionProps {
  match: MatchWithTeams
  existingPrediction?: Prediction | null
  /** Lo que el usuario tiene tipeado, que vive en el formulario padre. */
  predictionValue?: MatchPredictionValues
  onValueChange: (matchId: Uuid, field: 'home' | 'away' | 'qualifier', value: string) => void
}

const WARNING_MESSAGES = {
  missed: '🔒 No cargaste pronóstico para este partido',
  locked: '⏰ Ya no se pueden cargar pronósticos para este partido',
}

/**
 * La tarjeta para pronosticar un partido.
 *
 * Era de 614 líneas: el selector de clasificado, el panel de resultado y el
 * encabezado se fueron a subcomponentes, y las reglas —qué aviso mostrar, quién
 * clasifica— a `matchWarnings.js` y `qualifier.js`, que son puras y tienen tests.
 */
const MatchPrediction = ({
  match,
  existingPrediction,
  predictionValue,
  onValueChange,
}: MatchPredictionProps) => {
  const { activeTournament, isReadOnly } = useTournament()
  const awayInputRef = useRef(null)

  const canPredict = !isReadOnly && canPredictMatchByTime(match.match_date)

  // En el Mundial el partido destacado es el primero de la fecha; en los torneos
  // locales, el que tiene el mismo número que la fecha.
  const isGameOfTheRound =
    activeTournament?.slug === 'mundial-2026'
      ? match.match_number === 1
      : match.round_number === match.match_number

  const status = getMatchStatus({
    matchDate: match.match_date,
    isFinished: match.is_finished,
    isReadOnly,
  })
  const warning = getMatchWarning({
    matchDate: match.match_date,
    isFinished: match.is_finished,
    hasPrediction: Boolean(existingPrediction),
  })

  const qualifier = resolveQualifier({ match, existingPrediction, predictionValue, canPredict })

  // Inicializar valores desde la predicción guardada.
  // Solo se setea un campo si todavía es undefined: nunca se pisa lo que el
  // usuario editó.
  useEffect(() => {
    if (!existingPrediction) return

    if (predictionValue?.home === undefined) {
      onValueChange(match.id, 'home', existingPrediction.home_prediction.toString())
    }
    if (predictionValue?.away === undefined) {
      onValueChange(match.id, 'away', existingPrediction.away_prediction.toString())
    }
    if (match.is_playoff && predictionValue?.qualifier === undefined) {
      onValueChange(
        match.id,
        'qualifier',
        existingPrediction.qualifier_prediction_id || match.home_team_id
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingPrediction, match.id, predictionValue])

  // Mantener el clasificado en sincronía con el marcador. La decisión de qué
  // escribir (o de no escribir nada) vive en `getQualifierToSync`.
  const qualifierToSync = getQualifierToSync({
    match,
    existingPrediction,
    predictionValue,
    canPredict,
  })

  useEffect(() => {
    if (qualifierToSync) onValueChange(match.id, 'qualifier', qualifierToSync)
  }, [qualifierToSync, match.id, onValueChange])

  const handleInputChange = useCallback(
    (field, value) => {
      if (!canPredict) return

      // Un solo dígito, o vacío para borrar.
      if (value !== '' && !/^[0-9]$/.test(value)) return

      onValueChange(match.id, field, value)

      // Cargado el gol del local, el foco salta al del visitante.
      if (field === 'home' && value !== '' && awayInputRef.current) {
        awayInputRef.current.focus()
      }
    },
    [canPredict, onValueChange, match.id]
  )

  const handleQualifierChange = useCallback(
    teamId => {
      if (!canPredict || qualifier.isLocked || !match.is_playoff) return
      onValueChange(match.id, 'qualifier', teamId)
    },
    [canPredict, match.id, match.is_playoff, onValueChange, qualifier.isLocked]
  )

  // Editando se muestra lo tipeado; si no, lo guardado, y un guión si no hay nada.
  const homeValue = canPredict
    ? predictionValue?.home || ''
    : existingPrediction?.home_prediction?.toString() || '-'
  const awayValue = canPredict
    ? predictionValue?.away || ''
    : existingPrediction?.away_prediction?.toString() || '-'

  const tone = canPredict || existingPrediction ? 'primary' : 'muted'

  return (
    <div
      className={styles.card}
      data-highlight={isGameOfTheRound}
      data-dimmed={!canPredict && !match.is_finished && !existingPrediction}
    >
      <MatchHeader
        match={match}
        status={status}
        isGameOfTheRound={isGameOfTheRound}
        tournamentSlug={activeTournament?.slug}
      />

      <div className={styles.scoreboard}>
        <div className={styles.homeTeam}>
          <TeamDisplay team={match.home_team} size="sm" showNameBelow />
        </div>

        {/*
         * El `aria-label` no es opcional: sin él el nombre accesible del input sale
         * del placeholder, así que un lector de pantalla anuncia "-, editar" en las
         * dos cajitas y no hay forma de saber cuál es el local. Se vio en el árbol
         * de accesibilidad del navegador. El nombre del equipo lo sabe esta pantalla
         * y no `ScoreInput`, así que va acá.
         */}
        <ScoreInput
          value={homeValue}
          onChange={event => handleInputChange('home', event.target.value)}
          readOnly={!canPredict}
          tone={tone}
          aria-label={`Goles de ${match.home_team?.name || 'el local'}`}
        />

        <ScoreSeparator />

        <ScoreInput
          inputRef={awayInputRef}
          value={awayValue}
          onChange={event => handleInputChange('away', event.target.value)}
          readOnly={!canPredict}
          tone={tone}
          aria-label={`Goles de ${match.away_team?.name || 'la visita'}`}
        />

        <div className={styles.awayTeam}>
          <TeamDisplay team={match.away_team} size="sm" showNameBelow />
        </div>
      </div>

      {qualifier.shouldShowPicker && (
        <QualifierPicker
          // Los equipos embebidos son nullables (un cruce de playoff puede existir
          // antes de saber quién lo juega), así que se filtran: el selector los
          // dereferencia para mostrar nombre e id.
          teams={[match.home_team, match.away_team].filter(
            (team): team is TeamSummary => team !== null
          )}
          selectedTeamId={qualifier.selectedTeamId}
          isLocked={qualifier.isLocked}
          canPredict={canPredict}
          onSelect={handleQualifierChange}
        />
      )}

      {match.is_finished && <MatchOutcome match={match} prediction={existingPrediction} />}

      {warning && (
        <div className={styles.warning} data-kind={warning}>
          {WARNING_MESSAGES[warning]}
        </div>
      )}

      {canPredict && existingPrediction && (
        <p className={styles.saved}>
          <span aria-hidden="true">✓</span>
          <span>Pronóstico guardado (se actualizará al guardar todos)</span>
        </p>
      )}
    </div>
  )
}

export default memo(MatchPrediction)
