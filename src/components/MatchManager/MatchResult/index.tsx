import { useCallback, memo, useEffect, useRef } from 'react'
import TeamDisplay from '../../Common/TeamDisplay'
import ScoreInput, { ScoreSeparator } from '../../Common/ScoreInput'
import { canLoadResult, getResultLoadTime } from '../../../utils/matchTiming'
import QualifierPicker from '../../Common/QualifierPicker'
import {
  resolveQualifier,
  getQualifierToSync,
} from '../../PredictionForm/MatchPrediction/qualifier'
import { formatMatchDateShort, formatMatchTime } from '../../../utils/matchDate'
import { showsMatchNumber } from '../../../utils/matchNumber'

const MatchResult = ({ match, resultValues, onValueChange }) => {
  const awayInputRef = useRef(null)
  const canEditResult = canLoadResult(match.match_date)

  // Verde cuando el resultado ya esta cargado, gris cuando todavia no se puede
  // cargar (faltan las horas de delay), y el color de la app mientras se edita.
  const scoreTone = match.is_finished ? 'success' : !canEditResult ? 'muted' : 'primary'

  const handleInputChange = useCallback(
    (field, value) => {
      if (!canEditResult) return

      // Permitir vacío o solo un dígito (0-9)
      if (value === '' || /^[0-9]$/.test(value)) {
        onValueChange(match.id, field, value)

        // Si se ingresó un valor en el input home, pasar al away
        if (field === 'home' && value !== '' && awayInputRef.current) {
          awayInputRef.current.focus()
        }
      }
    },
    [canEditResult, onValueChange, match.id]
  )

  const homeScore = resultValues[match.id]?.home || ''
  const awayScore = resultValues[match.id]?.away || ''

  // Si ya tiene resultado, mostrar valores guardados
  const displayHomeValue = match.is_finished
    ? resultValues[match.id]?.home || match.home_score?.toString() || ''
    : homeScore

  const displayAwayValue = match.is_finished
    ? resultValues[match.id]?.away || match.away_score?.toString() || ''
    : awayScore

  const qualifier = resolveQualifier({
    match,
    predictionValue: resultValues[match.id],
    canPredict: true,
  })

  useEffect(() => {
    const toSync = getQualifierToSync({
      match,
      predictionValue: resultValues[match.id],
      canPredict: true,
    })
    if (toSync) onValueChange(match.id, 'qualifier', toSync)
  }, [match, onValueChange, resultValues])

  const handleQualifierChange = useCallback(
    qualifierTeamId => onValueChange(match.id, 'qualifier', qualifierTeamId),
    [match.id, onValueChange]
  )

  const formattedDate = formatMatchDateShort(match.match_date)
  const formattedTime = formatMatchTime(match.match_date)

  return (
    <div
      className="card"
      style={{
        position: 'relative',
        overflow: 'hidden',
        background:
          'linear-gradient(to bottom, var(--color-surface), var(--color-surface-variant))',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        padding: 'var(--space-sm)',
      }}
    >
      {showsMatchNumber(match) && (
        <div
          style={{
            position: 'absolute',
            top: 'var(--space-md)',
            left: 'var(--space-md)',
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-text-on-primary)',
            padding: 'var(--space-xs) var(--space-md)',
            borderRadius: 'var(--radius-lg)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: '700',
          }}
        >
          #{match.match_number}
        </div>
      )}

      {/* Match Status Badge */}
      {match.is_finished && (
        <div
          style={{
            position: 'absolute',
            top: 'var(--space-md)',
            right: 'var(--space-md)',
            backgroundColor: 'var(--color-success)',
            color: 'var(--color-text-on-primary)',
            padding: 'var(--space-2xs) var(--space-md)',
            borderRadius: 'var(--radius-lg)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: '600',
          }}
        >
          Finalizado
        </div>
      )}

      {/* Match Date and Time */}
      <div
        style={{
          /*
           * El unico valor del archivo que sigue siendo literal, y no porque falte un
           * token: **no es espaciado**. Es la altura libre que hace falta para pasar por
           * debajo de los dos badges absolutos de arriba (`top: var(--space-md)` mas su
           * alto), asi que sale de la geometria de esos badges y no de una escala.
           * `--space-2xl` (32px) los pisa.
           *
           * Y es una duplicacion: `MatchHeader.module.css` tiene el mismo `36px` en
           * `.meta` por el mismo motivo, porque las dos tarjetas implementan por su
           * cuenta el patron "badge absoluto arriba + contenido corrido". Se va cuando
           * `MatchResult` use `MatchHeader`, que es el refactor mas grande que este
           * archivo ya tiene anotado.
           */
          marginTop: '36px',
          marginBottom: 'var(--space-lg)',
          textAlign: 'center',
        }}
      >
        <span
          style={{
            fontSize: 'var(--font-size-md)',
            fontWeight: '600',
            color: 'var(--color-text-secondary)',
          }}
        >
          📅 {formattedDate} • 🕐 {formattedTime}
        </span>
      </div>

      {/*
       * Teams and Score.
       *
       * Los dos valores salen de `MatchPrediction.module.css`, no del token mas
       * cercano: esa es la tarjeta gemela —el mismo partido, la misma grilla de
       * `1fr auto auto auto 1fr`— y ya tenia `gap: var(--space-md)` y
       * `margin-bottom: var(--space-xl)`. Elegir por cercania habria dado 16px de
       * margen y dejado las dos tarjetas con ritmos distintos, que es justo lo que
       * la escala de tokens viene a evitar.
       */}
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto auto auto 1fr',
            gap: 'var(--space-md)',
            alignItems: 'center',
          }}
        >
          {/* Home Team */}
          <div style={{ justifySelf: 'end', textAlign: 'center' }}>
            <TeamDisplay team={match.home_team} size="sm" showNameBelow />
          </div>

          {/* Home Score Input */}
          {/* Sin `aria-label` el nombre accesible sale del placeholder y las dos
              cajitas se anuncian "-": no hay forma de saber cual es el local. */}
          <ScoreInput
            value={displayHomeValue}
            onChange={e => handleInputChange('home', e.target.value)}
            disabled={match.is_finished || !canEditResult}
            tone={scoreTone}
            aria-label={`Goles de ${match.home_team?.name || 'el local'}`}
          />

          <ScoreSeparator />

          {/* Away Score Input */}
          <ScoreInput
            inputRef={awayInputRef}
            value={displayAwayValue}
            onChange={e => handleInputChange('away', e.target.value)}
            disabled={match.is_finished || !canEditResult}
            tone={scoreTone}
            aria-label={`Goles de ${match.away_team?.name || 'la visita'}`}
          />

          {/* Away Team */}
          <div style={{ justifySelf: 'start', textAlign: 'center' }}>
            <TeamDisplay team={match.away_team} size="sm" showNameBelow />
          </div>
        </div>
      </div>

      {qualifier.shouldShowPicker && (
        <QualifierPicker
          teams={[match.home_team, match.away_team]}
          selectedTeamId={qualifier.selectedTeamId}
          canPredict={canEditResult}
          onSelect={handleQualifierChange}
          hint="Elegí quién clasificó por penales."
        />
      )}

      {!canEditResult && !match.is_finished && (
        <p
          style={{
            textAlign: 'center',
            marginTop: 'var(--space-sm)',
            // El hint equivalente del lado del jugador (`QualifierPicker`, `.hint`) usa
            // `--font-size-sm`. Es la misma clase de texto: una linea de estado debajo
            // del marcador.
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
            fontWeight: '600',
          }}
        >
          Disponible a las {formatMatchTime(getResultLoadTime(match.match_date))}
        </p>
      )}

      {/* Indicador de resultado guardado */}
      {match.is_finished && (
        <p
          style={{
            textAlign: 'center',
            marginTop: 'var(--space-md)',
            // El hint equivalente del lado del jugador (`QualifierPicker`, `.hint`) usa
            // `--font-size-sm`. Es la misma clase de texto: una linea de estado debajo
            // del marcador.
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-success)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-2xs)',
            fontWeight: '600',
          }}
        >
          <span>✓</span>
          <span>Resultado guardado</span>
        </p>
      )}
    </div>
  )
}

export default memo(MatchResult)
