import Spinner from '../Spinner'

const MESSAGE_STYLE = {
  color: 'var(--color-text-secondary)',
  fontSize: '1rem',
  fontWeight: '500',
}

export default function LoadingState({
  message = 'Cargando...',
  style,
  spinnerSize = 56,
  spacing = '20px',
}) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 16px', ...style }}>
      <div style={{ margin: `0 auto ${spacing}`, width: 'fit-content' }}>
        <Spinner size={spinnerSize} />
      </div>
      <p style={MESSAGE_STYLE}>{message}</p>
    </div>
  )
}
