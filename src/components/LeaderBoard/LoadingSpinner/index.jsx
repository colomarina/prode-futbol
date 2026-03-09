import { memo } from 'react'
import LoadingState from '../../Common/LoadingState'

const LoadingSpinner = memo(function LoadingSpinner({ size = 'md', label = 'Cargando...' }) {
  const config =
    size === 'sm'
      ? { style: { padding: '16px' }, spinnerSize: 24, spacing: '10px' }
      : { style: { padding: '48px 16px' }, spinnerSize: 56, spacing: '20px' }

  return (
    <LoadingState
      message={label}
      style={config.style}
      spinnerSize={config.spinnerSize}
      spacing={config.spacing}
    />
  )
})

export default LoadingSpinner
