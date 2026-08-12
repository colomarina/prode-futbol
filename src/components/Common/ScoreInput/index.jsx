import styles from './ScoreInput.module.css'

/**
 * La cajita donde se carga un gol.
 *
 * Estaba escrita dos veces, casi igual: en `MatchResult` para que el admin cargue
 * el resultado y en `MatchPrediction` para que el usuario pronostique. Con los
 * helpers `parseScoreValue` y `getWinnerTeamId` copiados literal en los dos
 * archivos, que se fueron a `utils/score.js`.
 *
 * Las dos diferencias reales entre aquellas copias son las dos props de acá:
 * `tone` —el admin ve en verde el resultado ya cargado— y `readOnly`, que en
 * pronósticos muestra un `div` en vez de un input deshabilitado, porque cuando
 * el partido ya empezó no hay nada que editar.
 *
 * @param {'primary'|'success'|'muted'} tone
 * @param {boolean} readOnly - Muestra el valor sin input.
 */
export default function ScoreInput({
  value,
  onChange,
  tone = 'primary',
  readOnly = false,
  inputRef,
  ...props
}) {
  const clases = [styles.box, styles[tone], readOnly ? styles.readOnly : styles.input].join(' ')

  if (readOnly) {
    return <div className={clases}>{value}</div>
  }

  return (
    <input
      ref={inputRef}
      type="tel"
      inputMode="numeric"
      pattern="[0-9]*"
      value={value}
      onChange={onChange}
      onFocus={event => event.target.select()}
      placeholder="-"
      className={clases}
      {...props}
    />
  )
}

/** El guión entre los dos goles, que también estaba duplicado. */
export function ScoreSeparator() {
  return <span className={styles.separator}>-</span>
}
