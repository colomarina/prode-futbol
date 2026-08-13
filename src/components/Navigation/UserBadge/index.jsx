import { tint } from '../../../utils/tint'

export default function UserBadge({ username }) {
  return (
    <div
      style={{
        // Eran tintes del emerald de Tailwind con el texto en `--color-primary`:
        // el fondo no seguía al torneo y el nombre del equipo sí.
        backgroundColor: tint('var(--color-primary)', 10),
        border: `1px solid ${tint('var(--color-primary)', 30)}`,
        borderRadius: 'var(--radius-sm)',
        padding: 'var(--space-2xs) var(--space-sm)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-2xs)',
      }}
    >
      <span style={{ fontSize: 'var(--font-size-2xs)' }}>Equipo: </span>
      <span
        style={{
          fontSize: 'var(--font-size-xs)',
          fontWeight: '600',
          color: 'var(--color-primary)',
        }}
      >
        {username}
      </span>
    </div>
  )
}
