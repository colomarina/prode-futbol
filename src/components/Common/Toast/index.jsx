import { useEffect } from 'react'
import IconButton from '../IconButton'
import styles from './Toast.module.css'

const ICONOS = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
}

export default function Toast({ message, type = 'success', onClose, duration = 30000 }) {
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
      <IconButton label="Cerrar aviso" onClick={onClose} style={{ fontSize: '1.5rem' }}>
        ×
      </IconButton>
    </div>
  )
}
