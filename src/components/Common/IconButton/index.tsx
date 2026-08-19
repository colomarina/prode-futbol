import type { ComponentProps } from 'react'
import styles from './IconButton.module.css'

interface IconButtonProps extends ComponentProps<'button'> {
  /** Va a `aria-label`. Obligatorio: sin el, el boton es anonimo. */
  label: string
  size?: 'md' | 'sm'
}

/**
 * Acción representada por un ícono, sin texto visible.
 *
 * Separado de `Button` por tres motivos: la geometría es otra (`Button` está
 * pensado para una etiqueta), no necesita variantes de color porque todos los de
 * la app son transparentes, y sobre todo **exige un nombre accesible**. Un ícono
 * suelto no le dice nada a un lector de pantalla, y eso no es hipotético: el
 * botón de cerrar del `Toast` no tenía ninguno hasta esta migración.
 *
 */
export default function IconButton({
  label,
  size = 'md',
  type = 'button',
  className = '',
  children,
  ...props
}: IconButtonProps) {
  if (import.meta.env.DEV && !label) {
    // eslint-disable-next-line no-console
    console.error(
      'IconButton: falta `label`. Sin él, el botón es anónimo para un lector de pantalla.'
    )
  }

  const clases = [styles.iconButton, size === 'sm' && styles.sm, className]
    .filter(Boolean)
    .join(' ')

  return (
    <button type={type} aria-label={label} className={clases} {...props}>
      {children}
    </button>
  )
}
