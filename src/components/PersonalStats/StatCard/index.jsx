import styles from './StatCard.module.css'

export const StatCard = ({
  icon,
  iconBg = 'rgba(14, 165, 233, 0.12)',
  iconColor = 'var(--color-primary)',
  title,
  value,
  unit = '',
  subtext = '',
  children,
  className = '',
  style = {},
}) => {
  return (
    <div className={`${styles.card} ${className}`} style={style}>
      <div className={styles.header}>
        <span className={styles.icon} style={{ background: iconBg, color: iconColor }}>
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
