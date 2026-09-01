import { tint } from '../../../../utils/tint'

import type { ReactNode } from 'react'

const TiebreakItem = ({
  order,
  title,
  description,
}: {
  order: string
  title: ReactNode
  description?: ReactNode
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--space-sm)',
        padding: 'var(--space-sm)',
        backgroundColor: tint('var(--color-info)', 8),
        borderRadius: 'var(--radius-md)',
      }}
    >
      <span style={{ fontSize: 'var(--font-size-xl)', minWidth: '24px' }}>{order}</span>
      <div style={{ fontSize: 'var(--font-size-md)', color: 'var(--color-text-primary)' }}>
        <strong>{title}</strong>
        {description && (
          <div
            style={{
              fontSize: 'var(--font-size-md)',
              color: 'var(--color-text-secondary)',
              marginTop: 'var(--space-3xs)',
            }}
          >
            {description}
          </div>
        )}
      </div>
    </div>
  )
}

export default TiebreakItem
