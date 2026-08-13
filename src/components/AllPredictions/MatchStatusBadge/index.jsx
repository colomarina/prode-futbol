// Las tres salen del mismo token de estado. Antes `finished` usaba la variable y
// sus dos hermanas hex de Tailwind, en el mismo objeto de tres entradas.
const STATUS = {
  notStarted: { bg: 'var(--color-error)', label: '🔒 No empezó' },
  finished: { bg: 'var(--color-success)', label: '✓ Finalizado' },
  inPlay: { bg: 'var(--color-warning)', label: '⚽ En juego' },
}

const MatchStatusBadge = ({ match }) => {
  const started = new Date() >= new Date(match.match_date)
  const key = !started ? 'notStarted' : match.is_finished ? 'finished' : 'inPlay'
  const { bg, label } = STATUS[key]

  return (
    <span
      style={{
        backgroundColor: bg,
        color: 'var(--color-text-on-primary)',
        padding: '4px 10px',
        borderRadius: '8px',
        fontSize: '0.7rem',
        fontWeight: '600',
      }}
    >
      {label}
    </span>
  )
}

export default MatchStatusBadge
