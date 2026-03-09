import { useEffect } from 'react'
import styles from './PaymentReminderModal.module.css'

/**
 * Modal de recordatorio de pago
 * Se muestra cuando la fecha está abierta y el pago figura pendiente
 * El estado real de pago se valida en backend
 */
const PaymentReminderModal = ({ isOpen, onClose, roundNumber }) => {
  // Cerrar con tecla Escape
  useEffect(() => {
    const handleEscape = e => {
      if (e.key === 'Escape' && isOpen) {
        handleRemindLater()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevenir scroll del body cuando la modal está abierta
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const handleRemindLater = () => {
    // Guardar en sessionStorage para no mostrar en esta sesión
    sessionStorage.setItem(`payment_reminder_round_${roundNumber}`, 'later')
    onClose()
  }

  const handleUnderstood = () => {
    onClose()
  }

  const handleBackdropClick = e => {
    if (e.target === e.currentTarget) {
      handleRemindLater()
    }
  }

  if (!isOpen) return null

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick} role="presentation">
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        {/* Header */}
        <div className={styles.header}>
          <span className={styles.icon}>💰</span>
          <h2 id="modal-title" className={styles.title}>
            Pago pendiente de esta fecha
          </h2>
        </div>

        {/* Content */}
        <div className={styles.content}>
          <p className={styles.message}>
            Para que tu participación quede confirmada, acordate de realizar el pago antes del
            cierre.
          </p>
          <p className={styles.note}>
            Cuando el admin confirme tu pago, este aviso deja de aparecer.
          </p>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            className={`${styles.button} ${styles.primaryButton}`}
            onClick={handleUnderstood}
            type="button"
          >
            <span>Entiendo, lo pago luego</span>
          </button>
          <button
            className={`${styles.button} ${styles.secondaryButton}`}
            onClick={handleRemindLater}
            type="button"
          >
            <span>Recordarme más tarde</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default PaymentReminderModal
