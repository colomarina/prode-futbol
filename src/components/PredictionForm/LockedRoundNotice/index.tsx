import styles from './LockedRoundNotice.module.css'

/**
 * El aviso de que la fecha ya pasó su ventana de edición.
 *
 * En modo consulta no se muestra: eso ya lo dice `RoundSummary` arriba y quedaría
 * repetido. La condición vive en el formulario, que es el que sabe las dos cosas.
 */
export default function LockedRoundNotice() {
  return (
    <div className={styles.box}>
      <p className={styles.text}>
        ⚽ Esta fecha ya pasó su ventana de edición. Los pronósticos que no estén guardados ya no se
        pueden modificar.
      </p>
    </div>
  )
}
