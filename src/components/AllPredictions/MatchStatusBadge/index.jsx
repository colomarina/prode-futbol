import Badge from '../../Common/Badge'

// Las tres salen del mismo token de estado. Antes `finished` usaba la variable y
// sus dos hermanas hex de Tailwind, en el mismo objeto de tres entradas.
const STATUS = {
  notStarted: { tone: 'error', label: '🔒 No empezó' },
  finished: { tone: 'success', label: '✓ Finalizado' },
  inPlay: { tone: 'warning', label: '⚽ En juego' },
}

const MatchStatusBadge = ({ match }) => {
  const started = new Date() >= new Date(match.match_date)
  const key = !started ? 'notStarted' : match.is_finished ? 'finished' : 'inPlay'
  const { tone, label } = STATUS[key]

  return (
    <Badge tone={tone} size="sm">
      {label}
    </Badge>
  )
}

export default MatchStatusBadge
