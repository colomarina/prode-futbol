import { useCallback, useState } from 'react'
import { useRoundPayments } from '../../hooks/useRoundPayments'
import Toast from '../Common/Toast'
import AdminPaymentsHeader from './AdminPaymentsHeader.jsx'
import PaymentsRoundFilters from './PaymentsRoundFilters.jsx'
import PaymentsTable from './PaymentsTable.jsx'

export default function AdminPayments() {
  const {
    rounds,
    roundsLoading,
    selectedRound,
    setSelectedRound,
    payments,
    loading,
    savingByUser,
    stats,
    updateUserPayment,
  } = useRoundPayments()

  const [toast, setToast] = useState(null)

  const handleChangePayment = useCallback(
    async (userId, hasPaid, fullName) => {
      const { error } = await updateUserPayment(userId, hasPaid)

      if (error) {
        setToast({
          type: 'error',
          message: `No se pudo actualizar el pago de ${fullName}: ${error.message}`,
        })
        return
      }

      setToast(null)
    },
    [updateUserPayment]
  )

  return (
    <div className="container" style={{ maxWidth: '1000px' }}>
      <AdminPaymentsHeader />

      <PaymentsRoundFilters
        rounds={rounds}
        roundsLoading={roundsLoading}
        selectedRound={selectedRound}
        onRoundSelect={setSelectedRound}
        stats={stats}
      />

      <PaymentsTable
        loading={loading}
        payments={payments}
        savingByUser={savingByUser}
        onTogglePayment={handleChangePayment}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
