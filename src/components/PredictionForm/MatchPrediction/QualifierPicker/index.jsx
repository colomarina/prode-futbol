import styles from './QualifierPicker.module.css'

/**
 * Quién clasifica si el partido de playoff termina empatado.
 *
 * Se muestra solo cuando el marcador pronosticado es un empate; las reglas de
 * cuándo y con qué seleccionado están en `../qualifier.js`.
 *
 * @param {{
 *   teams: Array<{id: string, name: string}>,
 *   selectedTeamId: string|null,
 *   isLocked: boolean,
 *   canPredict: boolean,
 *   onSelect: (teamId: string) => void,
 * }} props
 */
export default function QualifierPicker({ teams, selectedTeamId, isLocked, canPredict, onSelect }) {
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
              <span className={styles.team}>
                <span className={styles.radio} aria-hidden="true" />
                <span className={styles.teamName}>{team.name}</span>
              </span>

              {isSelected && <span className={styles.selectedTag}>SELECCIONADO</span>}
            </button>
          )
        })}
      </div>

      {canPredict && (
        <p className={styles.hint}>
          {isLocked
            ? 'No hace falta elegir: con ese marcador hay ganador directo.'
            : 'Elegí quién pensás que clasifica por penales.'}
        </p>
      )}
    </div>
  )
}
