import React, { useState, useCallback, useMemo } from 'react'

function LogoutButton({ onClick, variant = 'desktop' }) {
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseEnter = useCallback(() => setIsHovered(true), [])
  const handleMouseLeave = useCallback(() => setIsHovered(false), [])

  const buttonStyle = useMemo(() => {
    const baseStyle = {
      backgroundColor: isHovered ? 'var(--color-error)' : 'transparent',
      color: isHovered ? 'white' : 'var(--color-error)',
      border: '2px solid var(--color-error)',
      borderRadius: '8px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: variant === 'desktop' ? '6px' : '4px',
    }

    if (variant === 'desktop') {
      return {
        ...baseStyle,
        padding: '8px 16px',
        fontSize: '0.85rem',
      }
    }
    return {
      ...baseStyle,
      padding: '8px 14px',
      fontSize: '0.75rem',
    }
  }, [isHovered, variant])

  return (
    <button
      onClick={onClick}
      className={variant === 'mobile' ? 'mobile-menu-btn' : ''}
      style={buttonStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label="Cerrar sesión"
      title="Cerrar sesión"
    >
      <span>Salir</span>
    </button>
  )
}

export default React.memo(LogoutButton)
