import type { CSSProperties } from 'react'
import styles from './Spinner.module.css'

interface SpinnerProps {
  size?: number
  borderWidth?: number
  color?: string
  trackColor?: string
}

/**
 * React no tipa las custom properties dentro de `style`, y el spinner se configura
 * entero con ellas. Declararlas asi evita el cast que haria falta si no.
 */
type EstiloConVariables = CSSProperties & Record<`--${string}`, string>

/**
 * El único spinner de la app.
 *
 * Antes había cuatro: este, el de `App.css` (`.spinner` global), el del módulo de
 * `TournamentSelector`, y dos copias inline en `App.jsx` y `RoundManager` que
 * repetían esta misma geometría a mano.
 *
 * El color de la pista era `rgba(30, 127, 67, 0.1)`, o sea el verde del tema base
 * escrito a mano: en un torneo con otra paleta la pista seguía siendo verde.
 * Ahora sale del primario del torneo, así que acompaña al tema.
 */
export default function Spinner({
  size = 56,
  borderWidth = 4,
  color = 'var(--color-primary)',
  trackColor,
}: SpinnerProps) {
  // La pista es el mismo color pero apenas visible, así que se deriva en vez de
  // pedirla: quien pasa `color="var(--color-error)"` no tiene que acordarse de
  // pasar también el rojo transparente.
  const track = trackColor ?? `color-mix(in srgb, ${color} 12%, transparent)`

  const estilo: EstiloConVariables = {
    '--spinner-size': `${size}px`,
    '--spinner-border': `${borderWidth}px`,
    '--spinner-color': color,
    '--spinner-track': track,
  }

  return <div role="status" aria-label="Cargando" className={styles.spinner} style={estilo} />
}
