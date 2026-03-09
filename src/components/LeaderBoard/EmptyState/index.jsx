import { memo } from 'react'
import CommonEmptyState from '../../Common/EmptyState'

const EmptyState = memo(function EmptyState({
  title = 'No hay datos disponibles',
  subtitle = 'Los puntos se calculan al cargar resultados',
  icon = '📊',
}) {
  return (
    <CommonEmptyState
      icon={icon}
      title={title}
      description={subtitle}
      style={{ padding: '32px 16px' }}
      iconStyle={{ fontSize: '3rem', marginBottom: '12px' }}
      titleTag="p"
      titleStyle={{ fontSize: '1rem', marginBottom: '4px', fontWeight: '600' }}
      descriptionStyle={{ fontSize: '0.85rem' }}
    />
  )
})

export default EmptyState
