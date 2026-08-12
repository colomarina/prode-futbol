import { cloneElement, isValidElement, useId } from 'react'
import styles from './FormField.module.css'

/**
 * Una etiqueta, su control y su mensaje de error.
 *
 * Existe por un motivo concreto: en la app hay 23 `<label>` y solo 6 tienen
 * `htmlFor`. Un label sin asociar no le sirve a un lector de pantalla —no anuncia
 * de qué campo se trata— y tampoco enfoca el input al hacerle click. Acá el `id`
 * se genera con `useId` y se inyecta en el control, así no hay forma de olvidarlo.
 *
 * Tres formas de usarlo, según qué haya adentro:
 *
 * 1. Un solo control: se clona el hijo para pasarle el `id`.
 * 2. El control envuelto en otra cosa —el campo de contraseña lo está, por el
 *    botón del ojo—: se pasa una función y el `id` va donde corresponda.
 *    `<FormField label="X">{id => <div><TextInput id={id} /></div>}</FormField>`
 * 3. Varios controles bajo una etiqueta —una fecha y una hora—: no hay un `for`
 *    posible, así que va `group`, con `role="group"` + `aria-labelledby`.
 *
 * @param {string} label
 * @param {string} [error]
 * @param {boolean} [group] - La etiqueta nombra a varios controles, no a uno.
 */
export default function FormField({
  label,
  error,
  group = false,
  className = '',
  style,
  children,
}) {
  const id = useId()
  const labelId = `${id}-label`
  const errorId = `${id}-error`

  const clases = [styles.field, className].filter(Boolean).join(' ')

  if (group) {
    return (
      <div className={clases} style={style}>
        <span id={labelId} className={styles.label}>
          {label}
        </span>
        <div role="group" aria-labelledby={labelId} className={styles.group}>
          {children}
        </div>
        {error && <div className={styles.error}>{error}</div>}
      </div>
    )
  }

  const control =
    typeof children === 'function'
      ? children(id)
      : isValidElement(children)
        ? cloneElement(children, {
            id,
            'aria-invalid': error ? true : undefined,
            'aria-describedby': error ? errorId : undefined,
          })
        : children

  return (
    <div className={clases} style={style}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {control}
      {error && (
        <div id={errorId} className={styles.error}>
          {error}
        </div>
      )}
    </div>
  )
}
