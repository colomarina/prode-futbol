import { useCallback, useRef } from 'react'
import { useRoundFinance } from '../../hooks/useRoundFinance'
import FinanceOverview from './FinanceOverview.jsx'
import FinanceHistoryTable from './FinanceHistoryTable.jsx'

export default function AdminFinance() {
  const overviewSectionRef = useRef(null)
  const detailPanelRef = useRef(null)

  const {
    selectedRound,
    setSelectedRound,
    summaries,
    selectedSummary,
    overview,
    loading,
    saving,
    error,
    savePrize,
  } = useRoundFinance()

  const handlePrizeChange = useCallback(
    (roundNumber, prizeAmount) => {
      savePrize(roundNumber, prizeAmount)
    },
    [savePrize]
  )

  const scrollToDetail = useCallback(() => {
    const target = detailPanelRef.current || overviewSectionRef.current
    if (!target) return

    window.requestAnimationFrame(() => {
      const topOffset = 100
      const targetTop = target.getBoundingClientRect().top + window.scrollY - topOffset

      window.scrollTo({
        top: Math.max(targetTop, 0),
        behavior: 'smooth',
      })
    })
  }, [])

  const handleSelectRound = useCallback(
    roundNumber => {
      setSelectedRound(roundNumber)
      window.setTimeout(scrollToDetail, 80)
    },
    [scrollToDetail, setSelectedRound]
  )

  return (
    <div className="container" style={{ maxWidth: '1000px' }}>
      {error && <p style={{ color: 'var(--color-error)', marginBottom: '16px' }}>{error}</p>}

      <FinanceOverview
        sectionRef={overviewSectionRef}
        detailRef={detailPanelRef}
        overview={overview}
        selectedSummary={selectedSummary}
        onPrizeChange={handlePrizeChange}
        saving={saving}
      />

      <FinanceHistoryTable
        roundSummaries={summaries}
        selectedRound={selectedRound}
        onSelectRound={handleSelectRound}
        loading={loading}
      />
    </div>
  )
}
