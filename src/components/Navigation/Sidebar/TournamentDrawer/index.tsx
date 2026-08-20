import { useCallback } from 'react'
import { useDialogBehavior } from '../../../../hooks/useDialogBehavior'
import type { MouseEvent, ReactNode } from 'react'
import styles from './TournamentDrawer.module.css'

interface TournamentDrawerProps {
  isOpen: boolean
  onClose: () => void
  title?: ReactNode
  showBackButton?: boolean
  onBack?: () => void
  children?: ReactNode
}

export default function TournamentDrawer({
  isOpen,
  onClose,
  title = '⚽ Menú',
  showBackButton = false,
  onBack,
  children,
}: TournamentDrawerProps) {
  // Escape, bloqueo de scroll, trampa de foco y devolución del foco al cerrar.
  // Antes acá solo estaban las dos primeras, y el scroll se restauraba con un
  // `'unset'` a ciegas.
  const { contenedorRef } = useDialogBehavior(isOpen, onClose)

  const handleBackdropClick = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      if (e.target === e.currentTarget) {
        onClose()
      }
    },
    [onClose]
  )

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className={styles.backdrop} onClick={handleBackdropClick} role="presentation" />

      {/* Drawer */}
      <div
        ref={contenedorRef}
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* Header */}
        <div className={styles.drawerHeader}>
          {showBackButton && (
            <button
              className={styles.backButton}
              onClick={onBack}
              aria-label="Volver"
              type="button"
            >
              ‹
            </button>
          )}
          <h2 id="drawer-title" className={styles.drawerTitle}>
            {title}
          </h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Cerrar panel"
            type="button"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className={styles.drawerContent}>{children}</div>
      </div>
    </>
  )
}
