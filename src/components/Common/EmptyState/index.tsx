import type { CSSProperties, ReactNode } from 'react'

/** El tag del titulo: la pantalla decide si es h2, h3 o un span. */
type TitleTag = 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span'

interface EmptyStateProps {
  icon?: ReactNode
  title?: ReactNode
  description?: ReactNode
  style?: CSSProperties
  showIcon?: boolean
  titleTag?: TitleTag
  iconStyle?: CSSProperties
  titleStyle?: CSSProperties
  descriptionStyle?: CSSProperties
}

const TITLE_STYLE: CSSProperties = {
  color: 'var(--color-text-primary)',
  marginBottom: 'var(--space-sm)',
}

const DESCRIPTION_STYLE: CSSProperties = {
  color: 'var(--color-text-secondary)',
}

export default function EmptyState({
  icon = '⚽',
  title = 'No hay datos disponibles',
  description,
  style,
  showIcon = true,
  titleTag = 'h3',
  iconStyle,
  titleStyle,
  descriptionStyle,
}: EmptyStateProps) {
  const TitleTag = titleTag

  return (
    <div style={{ textAlign: 'center', padding: 'var(--space-3xl) var(--space-lg)', ...style }}>
      {showIcon && (
        <div
          style={{
            fontSize: 'var(--font-size-4xl)',
            marginBottom: 'var(--space-lg)',
            ...iconStyle,
          }}
        >
          {icon}
        </div>
      )}
      <TitleTag style={{ ...TITLE_STYLE, ...titleStyle }}>{title}</TitleTag>
      {description && <p style={{ ...DESCRIPTION_STYLE, ...descriptionStyle }}>{description}</p>}
    </div>
  )
}
