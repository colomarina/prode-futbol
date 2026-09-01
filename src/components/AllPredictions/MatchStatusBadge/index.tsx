import Badge from '../../Common/Badge'
import type { BadgeTone } from '../../Common/Badge'
import type { Match } from '../../../types/domain'

// Las tres salen del mismo token de estado. Antes `finished` usaba la variable y
// sus dos hermanas hex de Tailwind, en el mismo objeto de tres entradas.
const STATUS: Record<string, { tone: BadgeTone; label: string }> = {
  notStarted: { tone: 'error', label: '🔒 No empezó' },
  finished: { tone: 'success', label: '✓ Finalizado' },
  inPlay: { tone: 'warning', label: '⚽ En juego' },
}

const MatchStatusBadge = ({ match }: { match: Pick<Match, 'match_date' | 'is_finished'> }) => {
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
