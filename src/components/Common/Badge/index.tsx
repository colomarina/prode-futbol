import type { ComponentProps } from 'react'
import styles from './Badge.module.css'

export type BadgeTone = 'primary' | 'success' | 'error' | 'warning' | 'info' | 'neutral'

interface BadgeProps extends ComponentProps<'span'> {
  tone?: BadgeTone
  shape?: 'rounded' | 'pill'
  size?: 'sm' | 'md'
}

/**
 * La píldora de una palabra: el número de partido, el estado, el grupo.
 *
 * `style` queda abierto porque el badge de grupo del Mundial recibe sus colores
 * de `getGroupBadgeColors`, que devuelve un par distinto por grupo y no se puede
 * expresar como una variante fija.
 */
export default function Badge({
  tone = 'primary',
  shape = 'rounded',
  size = 'md',
  className = '',
  children,
  ...props
}: BadgeProps) {
  const clases = [
    styles.badge,
    styles[tone],
    shape === 'pill' && styles.pill,
    size === 'sm' && styles.sm,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={clases} {...props}>
      {children}
    </span>
  )
}
