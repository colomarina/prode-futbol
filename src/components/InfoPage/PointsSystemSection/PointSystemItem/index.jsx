const PointsSystemItem = ({ item }) => {
  const isComplexRule = !!item.rules

  return (
    <div
      style={{
        padding: isComplexRule ? '4px' : '12px',
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      {isComplexRule ? (
        // Regla compleja (PLENO con sub-reglas)
        <>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-md)',
              marginBottom: 'var(--space-sm)',
            }}
          >
            <span
              style={{
                fontSize: 'var(--font-size-3xl)',
                minWidth: '40px',
                textAlign: 'center',
              }}
            >
              {item.icon}
            </span>
            <strong
              style={{ color: 'var(--color-text-primary)', fontSize: 'var(--font-size-base)' }}
            >
              {item.title}
            </strong>
          </div>
          <div
            style={{
              marginLeft: '52px',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2xs)',
              fontSize: 'var(--font-size-md)',
              color: 'var(--color-text-secondary)',
            }}
          >
            {item.rules.map(rule => (
              <div key={rule.condition}>
                • {rule.condition}{' '}
                <span
                  style={{
                    color: 'var(--color-success)',
                    fontWeight: '700',
                  }}
                >
                  {rule.points}
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        // Regla simple
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-md)',
          }}
        >
          <span
            style={{
              fontSize: 'var(--font-size-3xl)',
              minWidth: '40px',
              textAlign: 'center',
            }}
          >
            {item.icon}
          </span>
          <div>
            <strong
              style={{ color: 'var(--color-text-primary)', fontSize: 'var(--font-size-base)' }}
            >
              {item.title}
            </strong>
            {item.points && (
              <span
                style={{
                  marginLeft: 'var(--space-sm)',
                  color: 'var(--color-success)',
                  fontWeight: '700',
                  fontSize: 'var(--font-size-lg)',
                }}
              >
                {item.points}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default PointsSystemItem
