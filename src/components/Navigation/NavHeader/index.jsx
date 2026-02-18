import React, { useCallback } from 'react'
import UserBadge from '../UserBadge'
import AdminBadge from '../AdminBadge'
import LogoutButton from '../LogoutButton'
import styles from './NavHeader.module.css'

function NavHeader({ profile, isAdmin, signOut }) {
  const handleLogout = useCallback(
    e => {
      if (e.type === 'click' || e.key === 'Enter' || e.key === ' ') {
        signOut()
      }
    },
    [signOut]
  )

  return (
    <header className={styles.prodeHeader}>
      <div className={styles.headerLeft}>
        <div className={styles.logoContainer}>⚽</div>
        <div className={styles.brandInfo}>
          <h1>Prode Chiqui Tapia</h1>
          <UserBadge username={profile?.username} />
        </div>
      </div>

      <div className={styles.headerRight}>
        {isAdmin() && <AdminBadge size="md" />}
        <LogoutButton onClick={handleLogout} variant="mobile" />
      </div>
    </header>
  )
}

export default React.memo(NavHeader)
