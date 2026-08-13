export default function PageHeader({ icon, title, subtitle }) {
  return (
    <div style={{ marginBottom: 'var(--space-xl)', textAlign: 'center' }}>
      <h2
        style={{
          fontWeight: '700',
          color: 'var(--color-primary-text)',
          marginBottom: 'var(--space-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-md)',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: 'var(--font-size-lg)' }}>{icon}</span>
        <span>{title}</span>
      </h2>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-base)' }}>
        {subtitle}
      </p>
    </div>
  )
}
