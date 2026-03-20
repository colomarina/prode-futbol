import styles from './AdminFinance.module.css'

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
})

function formatCurrency(amount) {
  return currencyFormatter.format(amount || 0)
}

function getAmountTone(amount) {
  if (amount > 0) return 'var(--color-success)'
  if (amount < 0) return 'var(--color-error)'
  return 'var(--color-text-primary)'
}

const TABLE_COLUMNS = ['Fechas', 'Pagos', 'Recaudado', 'Premio', 'Diferencia', 'Saldo']

function getMobileMetrics(round) {
  return [
    {
      label: 'Recaudado',
      value: formatCurrency(round.collectedAmount),
    },
    {
      label: 'Premio',
      value: formatCurrency(round.prizeAmount),
    },
    {
      label: 'Diferencia',
      value: formatCurrency(round.differenceAmount),
      color: getAmountTone(round.differenceAmount),
    },
    {
      label: 'Saldo',
      value: formatCurrency(round.runningBalance),
    },
  ]
}

export default function PaymentsFinancialHistoryTable({
  roundSummaries,
  selectedRound,
  onSelectRound,
  loading,
}) {
  return (
    <section className={styles.financeSection}>
      <div className={styles.financeSectionHeader}>
        <div>
          <h3 className={styles.financeSectionTitle}>Historico por fecha</h3>
          <p className={styles.financeSectionDescription}>
            Recaudación, premio, diferencia y saldo acumulado por fecha.
          </p>
        </div>
      </div>

      <div className={styles.financeTableWrap}>
        {loading ? (
          <p style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            Cargando...
          </p>
        ) : roundSummaries.length === 0 ? (
          <p style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            Sin datos financieros aún.
          </p>
        ) : (
          <>
            <table className={styles.financeTable}>
              <thead>
                <tr>
                  {TABLE_COLUMNS.map(column => (
                    <th key={column}>{column}</th>
                  ))}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {roundSummaries.map(round => {
                  const isSelected = round.roundNumber === selectedRound

                  return (
                    <tr
                      key={round.roundNumber}
                      className={isSelected ? styles.financeTableRowActive : ''}
                    >
                      <td>
                        <div className={styles.financeRoundCell}>
                          <strong>Fecha {round.roundNumber}</strong>
                          <span>{round.coverageRate}% de pagos</span>
                        </div>
                      </td>
                      <td>
                        {round.paidUsers} pagos / {round.pendingUsers} pendientes
                      </td>
                      <td>{formatCurrency(round.collectedAmount)}</td>
                      <td>{formatCurrency(round.prizeAmount)}</td>
                      <td
                        style={{
                          color: getAmountTone(round.differenceAmount),
                          fontWeight: 700,
                        }}
                      >
                        {formatCurrency(round.differenceAmount)}
                      </td>
                      <td>{formatCurrency(round.runningBalance)}</td>
                      <td>
                        <button
                          type="button"
                          className={styles.financeGhostButton}
                          onClick={() => onSelectRound(round.roundNumber)}
                        >
                          {isSelected ? 'Viendo' : 'Ver detalle'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            <div className={styles.financeMobileList}>
              {roundSummaries.map(round => {
                const isSelected = round.roundNumber === selectedRound
                const mobileMetrics = getMobileMetrics(round)

                return (
                  <article
                    key={round.roundNumber}
                    className={`${styles.financeMobileCard} ${isSelected ? styles.financeMobileCardActive : ''}`}
                  >
                    <div className={styles.financeMobileHeader}>
                      <div className={styles.financeRoundCell}>
                        <strong>Fecha {round.roundNumber}</strong>
                        <span>
                          {round.paidUsers} pagos, {round.pendingUsers} pendientes
                        </span>
                      </div>
                      <span className={styles.financeCardHint}>{round.coverageRate}% cubierto</span>
                    </div>

                    <div className={styles.financeMobileMetrics}>
                      {mobileMetrics.map(metric => (
                        <div key={metric.label}>
                          <p className={styles.financeMetricLabel}>{metric.label}</p>
                          <p
                            className={styles.financeMetricValue}
                            style={metric.color ? { color: metric.color } : undefined}
                          >
                            {metric.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      className={styles.financeGhostButton}
                      onClick={() => onSelectRound(round.roundNumber)}
                    >
                      {isSelected ? 'Viendo detalle' : 'Ver detalle'}
                    </button>
                  </article>
                )
              })}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
