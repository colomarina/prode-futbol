import Tippy from '@tippyjs/react'
import 'tippy.js/dist/tippy.css'
import '../../../styles/tippy-theme.css'

const INFO_BUTTON_TYPES = {
  info: {
    color: 'var(--color-primary)',
    icon: 'i',
  },
  error: {
    color: '#ef4444',
    icon: 'X',
  },
  warning: {
    color: '#f59e0b',
    icon: '⚠️',
  },
  success: {
    color: '#10b981',
    icon: '✓',
  },
}

const InfoButton = ({ message, type = 'info', ariaLabel = 'Información', placement = 'right' }) => {
  const config = INFO_BUTTON_TYPES[type] || INFO_BUTTON_TYPES.info

  const tippyProps = {
    placement,
    arrow: true,
    delay: [60, 0],
    interactive: false,
    hideOnClick: false,
    touch: ['mouseenter', 'touchstart'],
  }

  return (
    <Tippy content={message} {...tippyProps} theme="app">
      <button
        type="button"
        aria-label={ariaLabel}
        style={{
          padding: '6px 12px',
          borderRadius: '12px',
          width: '39px',
          minHeight: '32.5px',
          border: `2px solid ${config.color}`,
          fontSize: '0.8rem',
          fontWeight: '700',
          lineHeight: '1',
          cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
          backgroundColor: 'var(--color-surface)',
          color: config.color,
        }}
      >
        {config.icon}
      </button>
    </Tippy>
  )
}

export default InfoButton
