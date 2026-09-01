import type { ReactNode } from 'react'
import CommonEmptyState from '../../Common/EmptyState'

interface EmptyStateProps {
  icon?: ReactNode
  title?: ReactNode
  description?: ReactNode
}

const EmptyState = ({ icon, title, description }: EmptyStateProps) => {
  return (
    <CommonEmptyState
      icon={icon}
      title={title}
      description={description}
      style={{ padding: 'var(--space-3xl) var(--space-lg)' }}
      iconStyle={{ fontSize: 'var(--font-size-4xl)' }}
      descriptionStyle={{ lineHeight: 1.6, maxWidth: '500px', margin: '0 auto' }}
    />
  )
}

export default EmptyState
