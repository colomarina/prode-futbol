import type { ReactNode } from 'react'
import type { TeamSummary } from '../../../types/domain'
import styles from './MatchupLogos.module.css'

function TeamName({ team }: { team: TeamSummary }) {
  return (
    <span className={styles.nameBox}>
      <span className={styles.fullName}>{team.name}</span>
      <span className={styles.shortName} aria-hidden="true">
        {team.name.slice(0, 3).toUpperCase()}
      </span>
    </span>
  )
}

function Team({ team, reverse }: { team: TeamSummary | null | undefined; reverse?: boolean }) {
  if (!team) return <span className={styles.placeholder}>-</span>

  return (
    <span className={styles.team} data-reverse={reverse}>
      {team.logo_url && <img className={styles.logo} src={team.logo_url} alt="" loading="lazy" />}
      <TeamName team={team} />
    </span>
  )
}

export default function MatchupLogos({
  home,
  away,
  middle,
}: {
  home: TeamSummary | null | undefined
  away: TeamSummary | null | undefined
  middle: ReactNode
}) {
  return (
    <span className={styles.matchup}>
      <Team team={home} />
      <span className={styles.middle}>{middle}</span>
      <Team team={away} reverse />
    </span>
  )
}
