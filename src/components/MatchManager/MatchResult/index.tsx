import { useCallback, memo, useEffect, useMemo, useRef } from 'react'
import TeamDisplay from '../../Common/TeamDisplay'
import ScoreInput, { ScoreSeparator } from '../../Common/ScoreInput'
import { canLoadResult, getResultLoadTime } from '../../../utils/matchTiming'
import { getWinnerTeamId, parseScoreValue } from '../../../utils/score'
import { formatMatchDateShort, formatMatchTime } from '../../../utils/matchDate'

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

  const homeScoreNumber = parseScoreValue(displayHomeValue)
  const awayScoreNumber = parseScoreValue(displayAwayValue)
  const autoWinnerTeamId = getWinnerTeamId(homeScoreNumber, awayScoreNumber, match)

  const selectedQualifierTeamId = useMemo(() => {
    if (!match.is_playoff) return null

    return (
      autoWinnerTeamId ||
      resultValues[match.id]?.qualifier ||
      match.qualifier_team_id ||
      match.home_team_id
    )
  }, [
    autoWinnerTeamId,
    match.home_team_id,
    match.id,
    match.is_playoff,
    match.qualifier_team_id,
    resultValues,
  ])

  const qualifierIsLocked = Boolean(autoWinnerTeamId)

  useEffect(() => {
    if (!match.is_playoff) return

    if (autoWinnerTeamId && resultValues[match.id]?.qualifier !== autoWinnerTeamId) {
      onValueChange(match.id, 'qualifier', autoWinnerTeamId)
      return
    }

    if (!autoWinnerTeamId && !resultValues[match.id]?.qualifier) {
      onValueChange(match.id, 'qualifier', match.qualifier_team_id || match.home_team_id)
    }
  }, [
    autoWinnerTeamId,
    match.home_team_id,
    match.id,
    match.is_playoff,
    match.qualifier_team_id,
    onValueChange,
    resultValues,
  ])

  const handleQualifierChange = useCallback(
    qualifierTeamId => {
      if (!match.is_playoff || qualifierIsLocked) return
      onValueChange(match.id, 'qualifier', qualifierTeamId)
    },
    [match.id, match.is_playoff, onValueChange, qualifierIsLocked]
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
      {/* Match Number */}
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
        #{match.match_number || '?'}
      </div>

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
          // No sale de la escala: es lo que hace falta para pasar por debajo de los dos
          // badges absolutos de arriba (`top: var(--space-md)` + su alto). `--space-2xl`
          // (32px) los pisa.
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

      {/* Teams and Score */}
      {/* `20px` cae justo entre `--space-lg` (16) y `--space-xl` (24). */}
      <div style={{ marginBottom: '20px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto auto auto 1fr',
            // `10px` es el valor que `tokens.css` dejo afuera a proposito. Acá son 4
            // gaps en una grilla de 5 columnas, así que moverlo a `sm` o a `md`
            // cambia 8px el ancho total y hay que mirar el mobile antes.
            gap: '10px',
            alignItems: 'center',
          }}
        >
          {/* Home Team */}
          <div style={{ justifySelf: 'end', textAlign: 'center' }}>
            <TeamDisplay team={match.home_team} size="sm" showNameBelow />
          </div>

          {/* Home Score Input */}
          <ScoreInput
            value={displayHomeValue}
            onChange={e => handleInputChange('home', e.target.value)}
            disabled={match.is_finished || !canEditResult}
            tone={scoreTone}
          />

          <ScoreSeparator />

          {/* Away Score Input */}
          <ScoreInput
            inputRef={awayInputRef}
            value={displayAwayValue}
            onChange={e => handleInputChange('away', e.target.value)}
            disabled={match.is_finished || !canEditResult}
            tone={scoreTone}
          />

          {/* Away Team */}
          <div style={{ justifySelf: 'start', textAlign: 'center' }}>
            <TeamDisplay team={match.away_team} size="sm" showNameBelow />
          </div>
        </div>
      </div>

      {match.is_playoff && (
        <div
          style={{
            marginBottom: 'var(--space-lg)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-md)',
            backgroundColor: 'var(--color-surface-variant)',
          }}
        >
          <p
            style={{
              // Mismo `10px` sin token que el gap de la grilla.
              margin: '0 0 10px 0',
              fontSize: 'var(--font-size-md)',
              fontWeight: '700',
              color: 'var(--color-text-primary)',
            }}
          >
            🥊 Si empatan, ¿quién clasifica por penales?
          </p>

          {[match.home_team, match.away_team].map(team => (
            <label
              key={team.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-sm)',
                marginBottom: 'var(--space-sm)',
                cursor: qualifierIsLocked ? 'default' : 'pointer',
              }}
            >
              <input
                type="radio"
                name={`match-qualifier-${match.id}`}
                checked={selectedQualifierTeamId === team.id}
                disabled={qualifierIsLocked}
                onChange={() => handleQualifierChange(team.id)}
              />
              <span style={{ fontSize: 'var(--font-size-md)', color: 'var(--color-text-primary)' }}>
                {team.name}
              </span>
            </label>
          ))}

          {qualifierIsLocked && (
            <p
              style={{
                margin: 'var(--space-sm) 0 0 0',
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              No hace falta elegir: con ese marcador hay ganador directo.
            </p>
          )}
        </div>
      )}

      {!canEditResult && !match.is_finished && (
        <p
          style={{
            textAlign: 'center',
            marginTop: 'var(--space-sm)',
            // Justo en el medio de `--font-size-sm` (0.8) y `--font-size-md` (0.9): elegir
            // uno cambia el tamaño del texto en el panel de admin.
            fontSize: '0.85rem',
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
            // Justo en el medio de `--font-size-sm` (0.8) y `--font-size-md` (0.9): elegir
            // uno cambia el tamaño del texto en el panel de admin.
            fontSize: '0.85rem',
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
