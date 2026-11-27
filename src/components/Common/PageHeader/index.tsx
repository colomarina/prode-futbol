import styles from './PageHeader.module.css'

export default function PageHeader({
  icon,
  title,
  subtitle,
  centered = false,
}: {
  icon: string
  title: string
  subtitle?: string
  centered?: boolean
}) {
  return (
    <div className={styles.header} data-centered={centered}>
      <h2 className={styles.title}>
        <span aria-hidden="true">{icon}</span>
        <span>{title}</span>
      </h2>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </div>
  )
}
