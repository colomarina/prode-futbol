import { tint } from '../../../../utils/tint'

const SpecialRulesBox = ({ icon, title, description, note }) => {
  return (
    <div
      style={{
        padding: 'var(--space-md)',
        backgroundColor: tint('var(--color-error)', 8),
        borderRadius: 'var(--radius-md)',
        border: `2px solid ${tint('var(--color-error)', 20)}`,
        marginBottom: 'var(--space-lg)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 'var(--space-sm)',
        }}
      >
        <span style={{ fontSize: 'var(--font-size-xl)' }}>{icon}</span>
        <div>
          <strong
            style={{
              fontSize: 'var(--font-size-base)',
              color: 'var(--color-error)',
              display: 'block',
              marginBottom: 'var(--space-2xs)',
            }}
          >
            {title}
          </strong>
          <div style={{ fontSize: 'var(--font-size-md)', color: 'var(--color-text-primary)' }}>
            {description}
          </div>
          {note && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--space-sm)',
                marginTop: 'var(--space-sm)',
                fontSize: 'var(--font-size-md)',
                color: 'var(--color-text-secondary)',
              }}
            >
              <span>➡️</span>
              <span>{note}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SpecialRulesBox
