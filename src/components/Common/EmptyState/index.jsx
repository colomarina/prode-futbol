const TITLE_STYLE = {
  color: 'var(--color-text-primary)',
  marginBottom: 'var(--space-sm)',
}

const DESCRIPTION_STYLE = {
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
}) {
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
