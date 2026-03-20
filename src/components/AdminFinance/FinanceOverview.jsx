import { useState, useEffect } from 'react'
import TextInput from '../Common/TextInput'
import styles from './AdminFinance.module.css'

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
})

function formatCurrency(amount) {
  return currencyFormatter.format(amount || 0)
}

function getDeltaTone(amount) {
  if (amount > 0) return styles.financePillPositive
  if (amount < 0) return styles.financePillNegative
  return styles.financePillNeutral
}

function getAmountText(amount) {
  if (amount > 0) return 'A favor'
  if (amount < 0) return 'En contra'
  return 'Empatado'
}

function getDetailMetrics(selectedSummary) {
  return [
    {
      label: 'Recaudado',
      value: formatCurrency(selectedSummary.collectedAmount),
    },
    {
      label: 'Premio cargado',
      value: formatCurrency(selectedSummary.prizeAmount),
    },
    {
      label: 'Diferencia',
      value: formatCurrency(selectedSummary.differenceAmount),
      tone: selectedSummary.differenceAmount,
    },
  ]
}

export default function PaymentsFinanceOverview({
  sectionRef,
  detailRef,
  overview,
  selectedSummary,
  onPrizeChange,
  saving,
}) {
  const [localPrize, setLocalPrize] = useState(selectedSummary?.prizeAmount ?? 0)

  useEffect(() => {
    setLocalPrize(selectedSummary?.prizeAmount ?? 0)
  }, [selectedSummary?.roundNumber, selectedSummary?.prizeAmount])

  const detailMetrics = selectedSummary ? getDetailMetrics(selectedSummary) : []
  const balanceTone = getDeltaTone(overview.currentBalance)
  const balanceText = getAmountText(overview.currentBalance)

  return (
    <section className={styles.financeSection} ref={sectionRef}>
      <div className={styles.financeSectionHeader}>
        <div>
          <h3 className={styles.financeSectionTitle}>Resumen financiero</h3>
          <p className={styles.financeSectionDescription}>
            Saldo general del juego y detalle de la fecha que estás mirando.
          </p>
        </div>
      </div>

      <div className={styles.financeCardsGrid}>
        <article className={`${styles.financeCard} ${styles.financeCardHero}`}>
          <p className={styles.financeCardLabel}>Saldo acumulado</p>
          <p className={styles.financeCardValue}>{formatCurrency(overview.currentBalance)}</p>
          <div className={styles.financeCardFooter}>
            <span className={`${styles.financePill} ${balanceTone}`}>{balanceText}</span>
            <span className={styles.financeCardHint}>Resultado neto de todas las fechas</span>
          </div>
        </article>
      </div>

      {selectedSummary && (
        <div className={styles.financeDetailPanel} ref={detailRef}>
          <div>
            <p className={styles.financePanelEyebrow}>Fecha seleccionada</p>
            <h4 className={styles.financePanelTitle}>Fecha {selectedSummary.roundNumber}</h4>
            <p className={styles.financeSectionDescription}>
              Recaudación, premio y diferencia de esta fecha. Editá el premio para actualizar el
              saldo acumulado.
            </p>
          </div>

          <div className={styles.financeInlineMetrics}>
            {detailMetrics.map(metric => (
              <Metric
                key={metric.label}
                label={metric.label}
                value={metric.value}
                tone={metric.tone}
              />
            ))}
            <label className={styles.financeInputBlock}>
              <span className={styles.financeMetricLabel}>Premio de la fecha</span>
              <TextInput
                type="number"
                numeric
                min="0"
                step="1000"
                value={localPrize}
                disabled={saving}
                onChange={e => setLocalPrize(Number(e.target.value) || 0)}
                onBlur={() => onPrizeChange(selectedSummary.roundNumber, localPrize)}
                onKeyDown={e =>
                  e.key === 'Enter' && onPrizeChange(selectedSummary.roundNumber, localPrize)
                }
              />
              {saving && <span className={styles.financeCardHint}>Guardando...</span>}
            </label>
          </div>
        </div>
      )}
    </section>
  )
}

function Metric({ label, value, tone = 0 }) {
  return (
    <div>
      <p className={styles.financeMetricLabel}>{label}</p>
      <p
        className={styles.financeMetricValue}
        style={{
          color:
            tone > 0
              ? 'var(--color-success)'
              : tone < 0
                ? 'var(--color-error)'
                : 'var(--color-text-primary)',
        }}
      >
        {value}
      </p>
    </div>
  )
}
