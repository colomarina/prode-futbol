import React from 'react'
import UserBadge from '../UserBadge'
import ThemeToggle from '../../Common/ThemeToggle'
import styles from './NavHeader.module.css'
import Sidebar from '../Sidebar'
import { useTournament } from '../../../contexts/TournamentContext'
import { getTournamentConfig } from '../../../config/tournaments.config'

function NavHeader({ profile, onNavigate, signOut }) {
  const { activeTournament } = useTournament()
  const tournamentConfig = getTournamentConfig(activeTournament?.slug)
  const prodeName = tournamentConfig?.prodeName || 'Prode Chiqui Tapia'

  return (
    <header className={styles.prodeHeader}>
      <div className={styles.headerLeft}>
        <div className={styles.logoContainer}>⚽</div>
        <div className={styles.brandInfo}>
          <h1>{prodeName}</h1>
          <UserBadge username={profile?.username} />
        </div>
      </div>

      <div className={styles.headerRight}>
        <ThemeToggle />
        <Sidebar onNavigate={onNavigate} onSignOut={signOut} />
      </div>
    </header>
  )
}

export default React.memo(NavHeader)
