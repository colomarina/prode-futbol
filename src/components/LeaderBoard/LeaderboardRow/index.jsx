import { memo } from 'react'
import { POSITION_CONFIG } from '../leaderboard.config'

const LeaderboardRow = memo(function LeaderboardRow({
  player,
  position,
  showRoundsColumn = false,
}) {
  const positionConfig = POSITION_CONFIG[position] || {}
  const { emoji, bgColor } = positionConfig

  return (
    <tr
      style={{
        backgroundColor: bgColor || 'transparent',
        borderBottom: '1px solid #E0E0E0',
        transition: 'background-color 0.2s',
      }}
    >
      <PositionCell position={position} emoji={emoji} />
      <PlayerCell player={player} />
      <PointsCell points={player.total_points} />
      {showRoundsColumn && <RoundsCell rounds={player.rounds_played || 0} />}
    </tr>
  )
})

const PositionCell = memo(function PositionCell({ position, emoji }) {
  return (
    <td
      style={{
        padding: '12px 8px',
        whiteSpace: 'nowrap',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        {emoji && <span style={{ fontSize: '1.3rem' }}>{emoji}</span>}
        <span
          style={{
            fontSize: '1rem',
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
  return (
    <td style={{ padding: '12px 8px' }}>
      <div>
        <div
          style={{
            fontSize: '0.9rem',
            fontWeight: '600',
            color: 'var(--color-text-primary)',
            marginBottom: '2px',
            textTransform: 'capitalize',
          }}
        >
          {player.username}
        </div>
        <div
          style={{
            fontSize: '0.8rem',
            color: 'var(--color-text-secondary)',
            textTransform: 'capitalize',
          }}
        >
          {player.full_name}
        </div>
      </div>
    </td>
  )
})

const PointsCell = memo(function PointsCell({ points }) {
  return (
    <td
      style={{
        padding: '12px 8px',
        textAlign: 'center',
      }}
    >
      <span
        style={{
          fontSize: '1.3rem',
          fontWeight: '700',
          color: 'var(--color-primary)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        {points}
        <span style={{ fontSize: '0.85rem' }}>pts</span>
      </span>
    </td>
  )
})

const RoundsCell = memo(function RoundsCell({ rounds }) {
  return (
    <td
      style={{
        padding: '12px 8px',
        textAlign: 'center',
      }}
    >
      <span
        style={{
          fontSize: '0.85rem',
          color: 'var(--color-text-secondary)',
          fontWeight: '600',
        }}
      >
        {rounds}
      </span>
    </td>
  )
})

export default LeaderboardRow
