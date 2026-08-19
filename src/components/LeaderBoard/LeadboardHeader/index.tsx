import { memo } from 'react'
import SelectDropdown from '../../Common/SelectDropdown'
import { getRoundDisplayName } from '../../../utils/roundLabels'
import type { LeaderboardRoundOption } from '../../../utils/leaderboardRounds'

/**
 * La fecha elegida: `null` es la general y `'playoffs'` la tabla agregada de la
 * llave. Es el mismo dominio que acepta `useLeaderboard`.
 */
export type LeaderboardSelection = number | 'playoffs' | null

/**
 * Una opción del selector. Las dos primeras son sintéticas —General y Playoffs— y
 * de ahí que `round_number` y `name` sean más laxos que en una fecha real.
 */
interface RoundOption {
  id: LeaderboardSelection
  round_number: LeaderboardSelection
  name?: string | null
}

interface LeaderboardHeaderProps {
  selectedRound: LeaderboardSelection
  setSelectedRound: (round: LeaderboardSelection) => void
  rounds?: LeaderboardRoundOption[]
  roundsLoading?: boolean
  showPlayoffs?: boolean
  isWorldCupTournament?: boolean
}

/**
 * `rounds` ya viene filtrado y ordenado por `getLeaderboardRounds`: acá no se
 * decide qué fechas tienen tabla propia, solo cómo se etiquetan.
 */
const LeaderboardHeader = memo(function LeaderboardHeader({
  selectedRound,
  setSelectedRound,
  rounds = [],
  roundsLoading,
  showPlayoffs = false,
  isWorldCupTournament = false,
}: LeaderboardHeaderProps) {
  const playoffLabel = isWorldCupTournament ? '🥊 Cuartos a Final' : '🥊 Playoffs'
  const roundOptions: RoundOption[] = [
    { id: null, round_number: null, name: '🏆 General' },
    // Los `as const` mantienen `'playoffs'` como literal: dentro del spread
    // condicional el tipo del array no alcanza a acotarlo y se ensancha a `string`.
    ...(showPlayoffs
      ? [{ id: 'playoffs' as const, round_number: 'playoffs' as const, name: playoffLabel }]
      : []),
    ...rounds,
  ]

  const renderRoundLabel = (round: RoundOption): string => {
    if (round.round_number === null) return '🏆 General'
    if (round.round_number === 'playoffs') return playoffLabel

    // Se le pasa la fecha ya acotada en vez del objeto entero: `RoundOption` admite
    // `'playoffs'` en `round_number` por las dos opciones sintéticas, y
    // `getRoundDisplayName` pide un número. Los dos guards de arriba lo garantizan.
    return `📅 ${getRoundDisplayName({ name: round.name ?? null, round_number: round.round_number })}`
  }

  return (
    <div style={{ marginBottom: 'var(--space-lg)' }}>
      <h2
        style={{
          fontWeight: '700',
          color: 'var(--color-primary-text)',
          margin: '0 0 var(--space-md) 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-sm)',
          fontSize: 'var(--font-size-2xl)',
        }}
      >
        <span>🏆</span>
        <span>Tabla de Posiciones</span>
      </h2>

      {/* Con una sola opción no hay nada que elegir: la General ya está a la vista. */}
      {roundOptions.length > 1 && (
        <SelectDropdown
          items={roundOptions}
          selectedId={selectedRound === null ? null : selectedRound}
          onSelect={value => setSelectedRound(value)}
          valueKey="id"
          isLoading={roundsLoading}
          placeholder="Seleccionar fecha..."
          renderButton={round => (
            <span style={{ fontWeight: '600' }}>{renderRoundLabel(round)}</span>
          )}
          renderOption={round => (
            <span style={{ flex: 1, fontWeight: '600' }}>{renderRoundLabel(round)}</span>
          )}
        />
      )}
    </div>
  )
})

export default LeaderboardHeader
