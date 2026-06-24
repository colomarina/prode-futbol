import styles from './MetricCard.module.css'

export const MetricCard = ({ icon, label, value, unit = '', subtext = '' }) => {
  return (
    <div className={styles.card}>
      <div className={styles.icon}>{icon}</div>
      <div className={styles.content}>
        <p className={styles.label}>{label}</p>
        <p className={styles.value}>
          {value}
          {unit && <span className={styles.unit}>{unit}</span>}
        </p>
        {subtext && <p className={styles.subtext}>{subtext}</p>}
      </div>
    </div>
  )
}
