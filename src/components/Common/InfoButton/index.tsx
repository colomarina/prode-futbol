import type { ReactNode } from 'react'
import Tippy from '@tippyjs/react'
import type { TippyProps } from '@tippyjs/react'
import 'tippy.js/dist/tippy.css'
import '../../../styles/tippy-theme.css'

/** Los cuatro tonos del globito, con su color y su icono. */
export type InfoButtonType = 'info' | 'error' | 'warning' | 'success'

interface InfoButtonProps {
  message: ReactNode
  type?: InfoButtonType
  ariaLabel?: string
  placement?: TippyProps['placement']
}

const INFO_BUTTON_TYPES: Record<InfoButtonType, { color: string; icon: string }> = {
  info: {
    color: 'var(--color-primary-text)',
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

const InfoButton = ({
  message,
  type = 'info',
  ariaLabel = 'Información',
  placement = 'right',
}: InfoButtonProps) => {
  const config = INFO_BUTTON_TYPES[type] || INFO_BUTTON_TYPES.info

  const tippyProps: Partial<TippyProps> = {
    placement,
    arrow: true,
    delay: [60, 0],
    interactive: false,
    hideOnClick: false,
    /**
     * Aca habia `touch: ['mouseenter', 'touchstart']`, que **no es un valor valido**:
     * la opcion `touch` de tippy acepta `boolean | 'hold' | ['hold', number]`, y
     * esos dos son valores de `trigger`. Tippy no lo reconocia, asi que se
     * comportaba como el default (`touch: true`) y la linea no hacia nada. Lo
     * descubrio el tipado. Si algun dia se quiere cambiar como se abre en touch, la
     * opcion es `trigger`, no `touch`.
     */
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
