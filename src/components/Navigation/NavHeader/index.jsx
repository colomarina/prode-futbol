import React from 'react'
import UserBadge from '../UserBadge'
import ThemeToggle from '../../Common/ThemeToggle'
import styles from './NavHeader.module.css'
import Sidebar from '../Sidebar'

function NavHeader({ profile, onNavigate, signOut }) {
  return (
    <header className={styles.prodeHeader}>
      <div className={styles.headerLeft}>
        <div className={styles.logoContainer}>⚽</div>
        <div className={styles.brandInfo}>
          {/* TODO: Poner Prode GianniInfantino S.A cuando es el mundial */}
          <h1>Prode Chiqui Tapia</h1>
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
