import Tippy from '@tippyjs/react'
import 'tippy.js/dist/tippy.css'
import '../../../styles/tippy-theme.css'

const INFO_BUTTON_TYPES = {
  info: {
    color: 'var(--color-primary)',
    icon: 'i',
  },
  error: {
    color: 'var(--color-error)',
    icon: 'X',
  },
  warning: {
    color: 'var(--color-warning)',
    icon: '⚠️',
  },
  success: {
    color: 'var(--color-success)',
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
          padding: 'var(--space-xs) var(--space-md)',
          borderRadius: 'var(--radius-lg)',
          width: '39px',
          minHeight: '32.5px',
          border: `2px solid ${config.color}`,
          fontSize: 'var(--font-size-sm)',
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
