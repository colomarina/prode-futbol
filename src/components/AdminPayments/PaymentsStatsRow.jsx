import styles from './AdminPayments.module.css'

export default function PaymentsStatsRow({ stats }) {
  return (
    <div className={styles.paymentsStatsRow}>
      <div className={`${styles.paymentsStatItem} ${styles.paymentsStatItemUsers}`}>
        <StatCard label="Usuarios" value={stats.total} />
      </div>
      <div className={styles.paymentsStatItem}>
        <StatCard label="Pagaron" value={stats.paid} color="var(--color-success, #059669)" />
      </div>
      <div className={styles.paymentsStatItem}>
        <StatCard label="Pendientes" value={stats.pending} color="var(--color-warning, #d97706)" />
      </div>
    </div>
  )
}

function StatCard({ label, value, color = 'var(--color-text-primary)' }) {
  return (
    <div
      style={{
        background: 'var(--color-surface)',
        borderRadius: '10px',
        border: '1px solid var(--color-border)',
        padding: '10px 11px',
      }}
    >
      <p style={{ margin: '0 0 4px', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
        {label}
      </p>
      <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color }}>{value}</p>
    </div>
  )
}
