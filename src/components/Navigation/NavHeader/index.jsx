import React, { useCallback } from 'react'
import UserBadge from '../UserBadge'
import AdminBadge from '../AdminBadge'
import LogoutButton from '../LogoutButton'

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
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 0',
      }}
      role="banner"
    >
      <div>
        <h1
          style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '6px',
          }}
        >
          <span role="img" aria-label="Pelota de fútbol">
            ⚽
          </span>
          <span className="desktop-title">Prode Chiqui Tapia</span>
          <span className="mobile-title" style={{ display: 'none' }}>
            Prode Chiqui Tapia
          </span>
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <UserBadge username={profile?.username} />
          {isAdmin() && <AdminBadge size="md" />}
        </div>
      </div>

      {/* Desktop User Info */}
      <div className="desktop-flex">
        <div style={{ textAlign: 'right', marginRight: '16px' }}>
          <p
            style={{
              fontWeight: '600',
              fontSize: '0.9rem',
              color: 'var(--color-text-primary)',
              marginBottom: '2px',
            }}
          >
            {profile?.full_name}
          </p>
          <p
            style={{
              fontSize: '0.8rem',
              color: 'var(--color-text-secondary)',
            }}
          >
            @{profile?.username}
            {isAdmin() && (
              <span style={{ marginLeft: '6px' }}>
                <AdminBadge size="sm" />
              </span>
            )}
          </p>
        </div>
        <LogoutButton onClick={handleLogout} variant="desktop" />
      </div>

      {/* Mobile Logout Button */}
      <LogoutButton onClick={handleLogout} variant="mobile" />
    </div>
  )
}

export default React.memo(NavHeader)
