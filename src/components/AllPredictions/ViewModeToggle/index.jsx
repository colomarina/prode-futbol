import styles from './ViewModeToggle.module.css'

const ViewModeToggle = ({ viewMode, onChange }) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-lg)' }}>
      <div
        role="tablist"
        aria-label="Modo de vista"
        style={{
          display: 'inline-flex',
          gap: 'var(--space-sm)',
          background: 'var(--color-surface-variant)',
          padding: 'var(--space-xs)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
        }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={viewMode === 'by-match'}
          className={styles.modeButton}
          onClick={() => onChange('by-match')}
          style={{
            background: viewMode === 'by-match' ? 'var(--color-primary)' : 'transparent',
            color:
              viewMode === 'by-match'
                ? 'var(--color-text-on-primary)'
                : 'var(--color-text-primary)',
          }}
        >
          ⚽ Por partido
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={viewMode === 'by-user'}
          className={styles.modeButton}
          onClick={() => onChange('by-user')}
          style={{
            background: viewMode === 'by-user' ? 'var(--color-primary)' : 'transparent',
            color:
              viewMode === 'by-user' ? 'var(--color-text-on-primary)' : 'var(--color-text-primary)',
          }}
        >
          👤 Por usuario
        </button>
      </div>
    </div>
  )
}

export default ViewModeToggle
