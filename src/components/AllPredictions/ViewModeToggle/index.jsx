import styles from './ViewModeToggle.module.css'

const ViewModeToggle = ({ viewMode, onChange }) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
      <div
        role="tablist"
        aria-label="Modo de vista"
        style={{
          display: 'inline-flex',
          gap: '8px',
          background: 'var(--color-surface-variant)',
          padding: '6px',
          borderRadius: '12px',
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
            color: viewMode === 'by-match' ? '#fff' : 'var(--color-text-primary)',
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
            color: viewMode === 'by-user' ? '#fff' : 'var(--color-text-primary)',
          }}
        >
          👤 Por usuario
        </button>
      </div>
    </div>
  )
}

export default ViewModeToggle
