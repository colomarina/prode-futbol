import PaymentRow from './PaymentRow'
import EmptyState from '../Common/EmptyState'
import LoadingState from '../Common/LoadingState'

const TABLE_CONTAINER_STYLE = {
  background: 'var(--color-surface)',
  borderRadius: '14px',
  border: '1px solid var(--color-border)',
  overflow: 'hidden',
}

const TABLE_HEADER_STYLE = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(120px, 160px)',
  gap: '12px',
  padding: '12px 16px',
  borderBottom: '1px solid var(--color-border)',
  fontSize: '0.85rem',
  color: 'var(--color-text-secondary)',
  fontWeight: '600',
}

const TABLE_STATUS_STYLE = { padding: '24px 16px' }

export default function PaymentsTable({ loading, payments, savingByUser, onTogglePayment }) {
  return (
    <div style={TABLE_CONTAINER_STYLE}>
      <div style={TABLE_HEADER_STYLE}>
        <span>Usuario</span>
        <span style={{ textAlign: 'right' }}>Estado de Pago</span>
      </div>

      {loading ? (
        <LoadingState
          message="Cargando pagos..."
          style={TABLE_STATUS_STYLE}
          spinnerSize={36}
          spacing="12px"
        />
      ) : payments.length === 0 ? (
        <EmptyState
          title="No hay usuarios para mostrar."
          style={TABLE_STATUS_STYLE}
          showIcon={false}
          titleTag="p"
        />
      ) : (
        payments.map(user => (
          <PaymentRow
            key={user.userId}
            user={user}
            isSaving={!!savingByUser[user.userId]}
            onToggle={onTogglePayment}
          />
        ))
      )}
    </div>
  )
}
