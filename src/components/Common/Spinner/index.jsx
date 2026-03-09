export default function Spinner({
  size = 56,
  borderWidth = 4,
  color = 'var(--color-primary)',
  trackColor = 'rgba(30, 127, 67, 0.1)',
}) {
  return (
    <div
      role="status"
      aria-label="Cargando"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        border: `${borderWidth}px solid ${trackColor}`,
        borderTop: `${borderWidth}px solid ${color}`,
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    />
  )
}
