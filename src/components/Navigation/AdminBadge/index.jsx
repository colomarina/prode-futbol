export default function AdminBadge({ size = 'md' }) {
  const sizeStyles = {
    sm: {
      fontSize: '0.7rem',
      padding: '2px 6px',
      borderRadius: '4px',
    },
    md: {
      fontSize: '0.7rem',
      padding: '3px 7px',
      borderRadius: '6px',
    },
  }

  return (
    <span
      style={{
        ...sizeStyles[size],
        backgroundColor: 'var(--color-error)',
        color: 'white',
        fontWeight: '600',
      }}
    >
      Admin
    </span>
  )
}
