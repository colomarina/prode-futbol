import React from 'react'
import logOut from '../../../assets/logout.svg'
import styles from './LogoutButton.module.css'

const LogoutButton = ({ onClick, variant = 'desktop' }) => {
  return (
    <button
      onClick={onClick}
      className={styles.logoutButton}
      aria-label="Cerrar sesión"
      title="Cerrar sesión"
    >
      <img src={logOut} alt="Cerrar sesión" style={{ width: '16px', height: '16px' }} />
      {variant === 'desktop' && <span>Cerrar sesión</span>}
    </button>
  )
}

export default React.memo(LogoutButton)
