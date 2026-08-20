import { useEffect } from 'react'
import IconButton from '../IconButton'
import styles from './Toast.module.css'

/** Los cuatro tonos del aviso. Cada uno tiene su clase en el modulo CSS. */
export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastProps {
  message: string
  type?: ToastType
  onClose: () => void
  /** Cuanto queda en pantalla antes de cerrarse solo. */
  duration?: number
}

const ICONOS: Record<ToastType, string> = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
}

export default function Toast({
  message,
  type = 'success',
  onClose,
  duration = 30000,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const variante = styles[type] ?? styles.info

  return (
    <div className={`${styles.toast} ${variante}`} role="status" aria-live="polite">
      <span className={styles.icono}>{ICONOS[type] || ICONOS.info}</span>
      <span className={styles.mensaje}>{message}</span>
      {/* El color lo hereda del toast, que ya es blanco sobre fondo de color. */}
      <IconButton
        label="Cerrar aviso"
        onClick={onClose}
        style={{ fontSize: 'var(--font-size-2xl)' }}
      >
        ×
      </IconButton>
    </div>
  )
}
