import InfoButton from '../../Common/InfoButton'
import styles from './StatSection.module.css'

export default function StatSection({ title, tooltip, children }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        {tooltip && (
          <InfoButton message={tooltip} ariaLabel={`Info ${title}`} placement="bottom-start" />
        )}
      </div>
      <div>{children}</div>
    </section>
  )
}
