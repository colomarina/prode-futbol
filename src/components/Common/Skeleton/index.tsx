import type { CSSProperties } from 'react'
import styles from './Skeleton.module.css'

interface SkeletonProps {
  /** Cualquier valor de CSS. Un `%` sirve para que la fila siga al ancho de su celda. */
  width?: string
  height?: string
  /** Un circulo, para los avatares y los escudos. */
  circle?: boolean
  style?: CSSProperties
  className?: string
}

/**
 * Un bloque que ocupa el lugar de algo que todavia no llego.
 *
 * ## Por que, si ya hay spinner
 *
 * `LoadingState` centra un spinner en una caja de alto propio, asi que la
 * pantalla salta cuando llega el contenido: el spinner se va y aparece una tabla
 * de diez filas. El skeleton reserva el alto que va a ocupar el contenido real,
 * asi que no hay salto.
 *
 * Eso solo funciona si las medidas coinciden con las de verdad. Un skeleton con
 * medidas inventadas causa el layout shift que viene a evitar, y encima miente
 * sobre lo que se va a ver: por eso los skeletons de cada pantalla se arman con
 * los mismos tokens de `padding` que el componente que reemplazan, no con
 * numeros elegidos a ojo.
 *
 * ## Accesibilidad
 *
 * El bloque va `aria-hidden`: es decoracion, y una docena de cajas vacias no le
 * dicen nada a un lector de pantalla. **Quien lo use tiene que anunciar la
 * carga aparte**, con un `role="status"` en el contenedor. Si no, cambiar el
 * spinner por skeletons empeora la pantalla en vez de mejorarla: el spinner
 * traia su `role="status"` y su "Cargando" incluidos.
 */
export default function Skeleton({
  width = '100%',
  height = '1rem',
  circle = false,
  style,
  className = '',
}: SkeletonProps) {
  const clases = className ? `${styles.skeleton} ${className}` : styles.skeleton

  return (
    <span
      aria-hidden="true"
      className={clases}
      style={{
        display: 'block',
        width,
        height,
        ...(circle ? { borderRadius: 'var(--radius-circle)' } : {}),
        ...style,
      }}
    />
  )
}
