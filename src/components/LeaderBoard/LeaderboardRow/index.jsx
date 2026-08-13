import IconButton from '../../Common/IconButton'
import { memo } from 'react'
import { POSITION_CONFIG } from '../leaderboard.config'
import InfoButton from '../../Common/InfoButton'

// Lista de jugadores suspendidos
const SUSPENDED_PLAYERS = ['Geronimo Andres Garcia', 'Ezequiel Cordoba']

const LeaderboardRow = memo(function LeaderboardRow({
  player,
  position,
  showRoundsColumn = false,
  showViewColumn = false,
  onViewPredictions,
  selectedRound,
}) {
  const positionConfig = POSITION_CONFIG[position] || {}
  const { emoji, bgColor } = positionConfig

  return (
    <tr
      style={{
        backgroundColor: bgColor || 'transparent',
        borderBottom: '1px solid var(--color-border)',
        transition: 'background-color 0.2s',
      }}
    >
      <PositionCell position={position} emoji={emoji} />
      <PlayerCell player={player} />
      <PointsCell points={player.total_points} />
      {showRoundsColumn && <RoundsCell rounds={player.rounds_played || 0} />}
      {showViewColumn && (
        <ViewCell
          player={player}
          selectedRound={selectedRound}
          onViewPredictions={onViewPredictions}
        />
      )}
    </tr>
  )
})

const PositionCell = memo(function PositionCell({ position, emoji }) {
  return (
    <td
      style={{
        padding: 'var(--space-md) var(--space-sm)',
        whiteSpace: 'nowrap',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-xs)',
        }}
      >
        {emoji && <span style={{ fontSize: 'var(--font-size-xl)' }}>{emoji}</span>}
        <span
          style={{
            fontSize: 'var(--font-size-base)',
            fontWeight: '700',
            color: 'var(--color-text-primary)',
          }}
        >
          {position}
        </span>
      </div>
    </td>
  )
})

const PlayerCell = memo(function PlayerCell({ player }) {
  const isSuspended = SUSPENDED_PLAYERS.includes(player.full_name)

  return (
    <td style={{ padding: 'var(--space-md) var(--space-sm)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
        <div>
          <div
            style={{
              fontSize: 'var(--font-size-md)',
              fontWeight: '600',
              color: isSuspended ? 'var(--color-error)' : 'var(--color-text-primary)',
              marginBottom: 'var(--space-3xs)',
              textTransform: 'capitalize',
            }}
          >
            {player.username}
          </div>
          <div
            style={{
              fontSize: 'var(--font-size-sm)',
              color: isSuspended ? 'var(--color-error)' : 'var(--color-text-secondary)',
              textTransform: 'capitalize',
            }}
          >
            {player.full_name}
          </div>
        </div>
        {isSuspended && (
          <InfoButton
            message="Jugador suspendido"
            type="error"
            ariaLabel="Jugador suspendido"
            position="top"
          />
        )}
      </div>
    </td>
  )
})

const PointsCell = memo(function PointsCell({ points }) {
  return (
    <td
      style={{
        padding: 'var(--space-md) var(--space-sm)',
        textAlign: 'center',
      }}
    >
      <span
        style={{
          fontSize: 'var(--font-size-xl)',
          fontWeight: '700',
          color: 'var(--color-primary-text)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'var(--space-2xs)',
        }}
      >
        {points}
        <span style={{ fontSize: 'var(--font-size-md)' }}>pts</span>
      </span>
    </td>
  )
})

const RoundsCell = memo(function RoundsCell({ rounds }) {
  return (
    <td
      style={{
        padding: 'var(--space-md) var(--space-sm)',
        textAlign: 'center',
      }}
    >
      <span
        style={{
          fontSize: 'var(--font-size-md)',
          color: 'var(--color-text-secondary)',
          fontWeight: '600',
        }}
      >
        {rounds}
      </span>
    </td>
  )
})

const ViewCell = memo(function ViewCell({ player, selectedRound, onViewPredictions }) {
  const handleClick = () => {
    if (!onViewPredictions || !selectedRound) return
    onViewPredictions({ userId: player.id, roundNumber: selectedRound })
  }

  return (
    <td
      style={{
        textAlign: 'center',
      }}
    >
      {/* Declaraba `btn-success` y despues la pisaba entera para volverse
          transparente: nunca fue un boton verde, era un icono fantasma. */}
      <IconButton
        size="sm"
        onClick={handleClick}
        label={`Ver pronosticos de ${player.username} en fecha ${selectedRound}`}
      >
        <span aria-hidden="true">👀</span>
      </IconButton>
    </td>
  )
})

export default LeaderboardRow
