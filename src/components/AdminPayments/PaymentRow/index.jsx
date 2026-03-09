import ToggleSwitch from '../../Common/ToggleSwitch'

export default function PaymentRow({ user, isSaving, onToggle }) {
  const displayName = user.fullName || user.username

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(120px, 160px)',
        gap: '12px',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <p
        style={{
          margin: 0,
          fontWeight: '600',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={displayName}
      >
        {displayName}
      </p>

      <label
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '8px',
          cursor: isSaving ? 'not-allowed' : 'pointer',
          opacity: isSaving ? 0.6 : 1,
        }}
      >
        <span style={{ fontSize: '0.85rem' }}>{user.hasPaid ? 'Pago' : 'Pendiente'}</span>
        <ToggleSwitch
          checked={user.hasPaid}
          disabled={isSaving}
          ariaLabel={`${displayName} - ${user.hasPaid ? 'marcar como pendiente' : 'marcar como pago'}`}
          onChange={event => onToggle(user.userId, event.target.checked, displayName)}
        />
      </label>
    </div>
  )
}
