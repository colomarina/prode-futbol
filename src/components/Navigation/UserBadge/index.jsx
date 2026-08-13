import { tint } from '../../../utils/tint'

export default function UserBadge({ username }) {
  return (
    <div
      style={{
        // Eran tintes del emerald de Tailwind con el texto en `--color-primary`:
        // el fondo no seguía al torneo y el nombre del equipo sí.
        backgroundColor: tint('var(--color-primary)', 10),
        border: `1px solid ${tint('var(--color-primary)', 30)}`,
        borderRadius: '6px',
        padding: '3px 8px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
      }}
    >
      <span style={{ fontSize: '0.7rem' }}>Equipo: </span>
      <span
        style={{
          fontSize: '0.75rem',
          fontWeight: '600',
          color: 'var(--color-primary)',
        }}
      >
        {username}
      </span>
    </div>
  )
}
