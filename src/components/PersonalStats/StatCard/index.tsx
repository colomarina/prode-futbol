import { tint } from '../../../utils/tint'
import type { CSSProperties, ReactNode } from 'react'
import styles from './StatCard.module.css'

interface StatCardProps {
  icon?: ReactNode
  /** El fondo del ícono se deriva de este color con `tint()`. */
  iconColor?: string
  title?: ReactNode
  value?: ReactNode
  unit?: string
  subtext?: ReactNode
  children?: ReactNode
  className?: string
  style?: CSSProperties
}

/**
 * El fondo del ícono ya no es una prop: es el tinte de `iconColor`.
 *
 * Antes venían las dos por separado (`iconBg` con un `rgba()` escrito a mano y
 * `iconColor` con un token) y se habían desincronizado en 5 de las 16 tarjetas:
 * "Racha en Top 3", "Racha en Top 3 histórica" y "Mejor Posición" tenían el
 * fondo violeta con el ícono verde, y el valor por defecto era fondo celeste con
 * ícono verde. Derivarlo de un solo color hace imposible que vuelvan a separarse.
 */
const StatCard = ({
  icon,
  iconColor = 'var(--color-primary)',
  title,
  value,
  unit = '',
  subtext = '',
  children,
  className = '',
  style = {},
}: StatCardProps) => {
  return (
    <div className={`${styles.card} ${className}`} style={style}>
      <div className={styles.header}>
        <span className={styles.icon} style={{ background: tint(iconColor, 12), color: iconColor }}>
          {icon}
        </span>
        <p className={styles.title}>{title}</p>
      </div>

      <div className={styles.body}>
        {value !== undefined && (
          <p className={styles.value}>
            {value}
            {unit && <span className={styles.unit}>{unit}</span>}
          </p>
        )}
        {subtext && <p className={styles.subtext}>{subtext}</p>}
        {children}
      </div>
    </div>
  )
}

export default StatCard
