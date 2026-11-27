import type { TeamSummary, Uuid } from '../../../types/domain'
import styles from './QualifierPicker.module.css'

/**
 * Quién clasifica si el partido de playoff termina empatado.
 *
 * Se muestra solo cuando el marcador pronosticado es un empate; las reglas de
 * cuándo y con qué seleccionado están en `PredictionForm/MatchPrediction/qualifier.ts`.
 *
 */
export default function QualifierPicker({
  teams,
  selectedTeamId,
  isLocked,
  canPredict,
  onSelect,
  hint = 'Elegí quién pensás que clasifica por penales.',
}: {
  teams: TeamSummary[]
  selectedTeamId: Uuid | null
  isLocked?: boolean
  canPredict?: boolean
  onSelect: (teamId: Uuid) => void
  hint?: string
}) {
  const disabled = !canPredict || isLocked

  return (
    <div className={styles.panel}>
      <p className={styles.question}>🥊 Si empatan, ¿quién clasifica por penales?</p>

      <div
        className={styles.options}
        role="radiogroup"
        aria-label="Seleccionar equipo que clasifica"
      >
        {teams.map(team => {
          const isSelected = selectedTeamId === team.id

          return (
            <button
              key={team.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => onSelect(team.id)}
              className={styles.option}
            >
              {isSelected && (
                <span className={styles.check} data-testid="qualifier-check" aria-hidden="true">
                  ✓
                </span>
              )}
              {team.logo_url ? (
                <img className={styles.logo} src={team.logo_url} alt="" loading="lazy" />
              ) : (
                <span className={styles.logo} aria-hidden="true">
                  ⚽
                </span>
              )}
              <span className={styles.teamName}>{team.name}</span>
            </button>
          )
        })}
      </div>

      {canPredict && (
        <p className={styles.hint}>
          {isLocked ? 'No hace falta elegir: con ese marcador hay ganador directo.' : hint}
        </p>
      )}
    </div>
  )
}
