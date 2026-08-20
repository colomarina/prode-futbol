import InfoButton from '../../Common/InfoButton'
import type { ReactNode } from 'react'
import styles from './StatSection.module.css'

interface StatSectionProps {
  title: string
  tooltip?: ReactNode
  children?: ReactNode
}

export default function StatSection({ title, tooltip, children }: StatSectionProps) {
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
