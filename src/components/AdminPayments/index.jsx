import { useCallback, useMemo, useState } from 'react'
import { useRoundPayments } from '../../hooks/useRoundPayments'
import Toast from '../Common/Toast'
import AdminPaymentsHeader from './AdminPaymentsHeader.jsx'
import PaymentsRoundFilters from './PaymentsRoundFilters.jsx'
import PaymentsSortFilters from './PaymentsSortFilters.jsx'
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
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortOrder, setSortOrder] = useState('name_asc')

  const counts = useMemo(
    () => ({
      all: payments.length,
      paid: payments.filter(p => p.hasPaid).length,
      pending: payments.filter(p => !p.hasPaid).length,
    }),
    [payments]
  )

  const displayedPayments = useMemo(() => {
    let result = [...payments]

    if (filterStatus === 'paid') {
      result = result.filter(p => p.hasPaid)
    } else if (filterStatus === 'pending') {
      result = result.filter(p => !p.hasPaid)
    }

    const getName = p => (p.fullName || p.username || '').toLowerCase()

    if (sortOrder === 'name_asc') {
      result.sort((a, b) => getName(a).localeCompare(getName(b)))
    } else if (sortOrder === 'name_desc') {
      result.sort((a, b) => getName(b).localeCompare(getName(a)))
    } else if (sortOrder === 'paid_first') {
      result.sort((a, b) => (b.hasPaid ? 1 : 0) - (a.hasPaid ? 1 : 0))
    } else if (sortOrder === 'pending_first') {
      result.sort((a, b) => (a.hasPaid ? 1 : 0) - (b.hasPaid ? 1 : 0))
    }

    return result
  }, [payments, filterStatus, sortOrder])

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

      setToast({
        type: hasPaid ? 'success' : 'warning',
        message: hasPaid ? `${fullName} pagó` : `${fullName} marcado como no pagado`,
      })
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

      <PaymentsSortFilters
        filterStatus={filterStatus}
        onFilterChange={setFilterStatus}
        sortOrder={sortOrder}
        onSortChange={setSortOrder}
        counts={counts}
      />

      <PaymentsTable
        loading={loading}
        payments={displayedPayments}
        savingByUser={savingByUser}
        onTogglePayment={handleChangePayment}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
