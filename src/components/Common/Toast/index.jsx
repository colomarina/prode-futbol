import IconButton from '../IconButton'
import { useEffect } from 'react'

export default function Toast({ message, type = 'success', onClose, duration = 30000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const getStyles = () => {
    const baseStyles = {
      position: 'fixed',
      top: '24px',
      right: '24px',
      padding: '16px 24px',
      borderRadius: '12px',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2), 0 2px 8px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontSize: '0.95rem',
      fontWeight: '600',
      zIndex: 'var(--z-toast)',
      animation: 'slideInRight 0.3s ease-out',
      minWidth: '300px',
      maxWidth: '500px',
    }

    const typeStyles = {
      success: {
        backgroundColor: '#10b981',
        color: 'white',
      },
      error: {
        backgroundColor: '#ef4444',
        color: 'white',
      },
      warning: {
        backgroundColor: '#f59e0b',
        color: 'white',
      },
      info: {
        backgroundColor: '#3b82f6',
        color: 'white',
      },
    }

    return { ...baseStyles, ...typeStyles[type] }
  }

  const getIcon = () => {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
    }
    return icons[type] || icons.info
  }

  return (
    <>
      <div style={getStyles()}>
        <span style={{ fontSize: '1.5rem' }}>{getIcon()}</span>
        <span style={{ flex: 1 }}>{message}</span>
        {/* El color lo hereda del toast, que ya es blanco sobre fondo de color. */}
        <IconButton label="Cerrar aviso" onClick={onClose} style={{ fontSize: '1.5rem' }}>
          ×
        </IconButton>
      </div>
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @media (max-width: 640px) {
          div[style*="position: fixed"] {
            top: 16px !important;
            right: 16px !important;
            left: 16px !important;
            min-width: auto !important;
          }
        }
      `}</style>
    </>
  )
}
