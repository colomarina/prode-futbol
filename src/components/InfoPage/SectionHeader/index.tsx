import type { ReactNode } from 'react'

const SectionHeader = ({
  icon,
  title,
  color,
  centered = false,
}: {
  icon?: ReactNode
  title: ReactNode
  color?: string
  /** Centrado repite el ícono a los dos lados del título. */
  centered?: boolean
}) => {
  return (
    <h3
      style={{
        fontWeight: '700',
        color,
        marginBottom: 'var(--space-lg)',
        fontSize: 'var(--font-size-lg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: centered ? 'center' : 'flex-start',
        gap: 'var(--space-sm)',
      }}
    >
      {icon && <span>{icon}</span>}
      <span>{title}</span>
      {centered && icon && <span>{icon}</span>}
    </h3>
  )
}

export default SectionHeader
