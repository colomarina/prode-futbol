const TITLE_STYLE = {
  color: 'var(--color-text-primary)',
  marginBottom: '8px',
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
    <div style={{ textAlign: 'center', padding: '48px 16px', ...style }}>
      {showIcon && (
        <div style={{ fontSize: '4rem', marginBottom: '16px', ...iconStyle }}>{icon}</div>
      )}
      <TitleTag style={{ ...TITLE_STYLE, ...titleStyle }}>{title}</TitleTag>
      {description && <p style={{ ...DESCRIPTION_STYLE, ...descriptionStyle }}>{description}</p>}
    </div>
  )
}
