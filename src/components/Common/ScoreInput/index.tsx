import type { ComponentProps, Ref } from 'react'
import styles from './ScoreInput.module.css'

interface ScoreInputProps extends ComponentProps<'input'> {
  /** Verde para el resultado ya cargado, gris para lo que no se puede editar. */
  tone?: 'primary' | 'success' | 'muted'
  /** Muestra el valor sin input: cuando el partido empezo no hay nada que editar. */
  readOnly?: boolean
  inputRef?: Ref<HTMLInputElement>
}

/**
 * La cajita donde se carga un gol.
 *
 * Estaba escrita dos veces, casi igual: en `MatchResult` para que el admin cargue
 * el resultado y en `MatchPrediction` para que el usuario pronostique. Con los
 * helpers `parseScoreValue` y `getWinnerTeamId` copiados literal en los dos
 * archivos, que se fueron a `utils/score.ts`.
 *
 * Las dos diferencias reales entre aquellas copias son las dos props de acá:
 * `tone` —el admin ve en verde el resultado ya cargado— y `readOnly`, que en
 * pronósticos muestra un `div` en vez de un input deshabilitado, porque cuando
 * el partido ya empezó no hay nada que editar.
 *
 * **El `aria-label` lo pone quien lo usa, y no es opcional.** Sin él el nombre
 * accesible sale del `placeholder`, así que las dos cajitas de un partido se
 * anuncian igual ("-") y no hay forma de saber cuál es el local. El nombre del
 * equipo lo sabe la pantalla, no este componente, así que no se puede resolver
 * acá; `ScoreInput` solo se asegura de reenviarlo con el resto de los props.
 */
export default function ScoreInput({
  value,
  onChange,
  tone = 'primary',
  readOnly = false,
  inputRef,
  ...props
}: ScoreInputProps) {
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

/**
 * El guión entre los dos goles, que también estaba duplicado.
 *
 * Va `aria-hidden`: es puntuación entre dos campos que ya se anuncian con su
 * nombre, así que leerlo solo agrega un "guión" en el medio.
 */
export function ScoreSeparator() {
  return (
    <span aria-hidden="true" className={styles.separator}>
      -
    </span>
  )
}
