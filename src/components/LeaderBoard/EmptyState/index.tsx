import { memo } from 'react'
import type { ReactNode } from 'react'
import CommonEmptyState from '../../Common/EmptyState'

interface EmptyStateProps {
  title?: ReactNode
  subtitle?: ReactNode
  icon?: ReactNode
}

const EmptyState = memo(function EmptyState({
  title = 'No hay datos disponibles',
  subtitle = 'Los puntos se calculan al cargar resultados',
  icon = '📊',
}: EmptyStateProps) {
  return (
    <CommonEmptyState
      icon={icon}
      title={title}
      description={subtitle}
      style={{ padding: 'var(--space-2xl) var(--space-lg)' }}
      iconStyle={{ fontSize: 'var(--font-size-4xl)', marginBottom: 'var(--space-md)' }}
      titleTag="p"
      titleStyle={{
        fontSize: 'var(--font-size-base)',
        marginBottom: 'var(--space-2xs)',
        fontWeight: '600',
      }}
      descriptionStyle={{ fontSize: 'var(--font-size-md)' }}
    />
  )
})

export default EmptyState
