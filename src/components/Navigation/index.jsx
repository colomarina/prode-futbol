import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import PredictionForm from '../PredictionForm'
import Leaderboard from '../LeaderBoard'
import MatchManager from '../MatchManager'
import RoundManager from '../RoundManager'
import AllPredictions from '../AllPredictions'

export default function Navigation() {
  const [activeTab, setActiveTab] = useState('predictions')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { profile, isAdmin, signOut } = useAuth()

  const tabs = [
    {
      id: 'predictions',
      label: 'Mis Pronósticos',
      mobileLabel: 'Pronósticos',
      icon: '📊',
      adminOnly: false,
    },
    {
      id: 'all-predictions',
      label: 'Ver Pronósticos',
      mobileLabel: 'Rivales',
      icon: '👀',
      adminOnly: false,
    },
    {
      id: 'leaderboard',
      label: 'Tabla de Posiciones',
      mobileLabel: 'Tabla',
      icon: '🏆',
      adminOnly: false,
    },
    {
      id: 'admin',
      label: 'Administrar Partidos',
      mobileLabel: 'Partidos',
      icon: '⚙️',
      adminOnly: true,
    },
    {
      id: 'rounds',
      label: 'Gestionar Fechas',
      mobileLabel: 'Fechas',
      icon: '📅',
      adminOnly: true,
    },
  ]

  const visibleTabs = tabs.filter(tab => !tab.adminOnly || isAdmin())

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-background)' }}>
      {/* Header - Mobile First */}
      <nav
        style={{
          backgroundColor: 'var(--color-surface)',
          boxShadow: 'var(--shadow-md)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div className="container">
          {/* Mobile Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 0',
            }}
          >
            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>⚽</span>
              <span>Prode Chiqui Tapia</span>
            </h1>

            {/* Desktop User Info */}
            <div style={{ display: 'none' }} className="desktop-flex">
              <div style={{ textAlign: 'right', marginRight: '16px' }}>
                <p
                  style={{
                    fontWeight: '600',
                    fontSize: '0.95rem',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {profile?.full_name}
                </p>
                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  @{profile?.username}
                </p>
                {isAdmin() && (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      backgroundColor: 'var(--color-error)',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      display: 'inline-block',
                      marginTop: '4px',
                    }}
                  >
                    Admin
                  </span>
                )}
              </div>
              <button onClick={signOut} className="btn-error" style={{ padding: '8px 16px' }}>
                Salir
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="mobile-menu-btn"
              style={{
                padding: '8px',
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '1.5rem',
              }}
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div
              className="mobile-menu"
              style={{ paddingBottom: '16px', borderTop: '1px solid #E0E0E0' }}
            >
              <div
                style={{
                  padding: '16px',
                  backgroundColor: 'var(--color-surface-variant)',
                  marginTop: '8px',
                  borderRadius: '8px',
                }}
              >
                <p style={{ fontWeight: '600', marginBottom: '4px' }}>{profile?.full_name}</p>
                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--color-text-secondary)',
                    marginBottom: '8px',
                  }}
                >
                  @{profile?.username}
                </p>
                {isAdmin() && (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      backgroundColor: 'var(--color-error)',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      display: 'inline-block',
                    }}
                  >
                    Admin
                  </span>
                )}
              </div>
              <button
                onClick={signOut}
                className="btn-error"
                style={{ width: '100%', marginTop: '12px' }}
              >
                Cerrar Sesión
              </button>
            </div>
          )}

          {/* Tabs - Responsive */}
          <div
            className="tabs-container"
            style={{
              display: 'flex',
              gap: '0px',
              borderBottom: '2px solid #E5E7EB',
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {visibleTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  setMobileMenuOpen(false)
                }}
                className="tab-button"
                style={{
                  flex: '1',
                  padding: '12px 8px',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  backgroundColor: activeTab === tab.id ? '#f0fdf4' : 'transparent',
                  border: 'none',
                  borderBottom:
                    activeTab === tab.id
                      ? '4px solid var(--color-primary)'
                      : '4px solid transparent',
                  borderLeft: activeTab === tab.id ? '1px solid #dcfce7' : '1px solid transparent',
                  borderRight: activeTab === tab.id ? '1px solid #dcfce7' : '1px solid transparent',
                  color:
                    activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  minHeight: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2px',
                  position: 'relative',
                  boxShadow: activeTab === tab.id ? '0 -2px 8px rgba(16, 185, 129, 0.1)' : 'none',
                }}
              >
                <span
                  style={{
                    fontSize: '1.15rem',
                    display: 'block',
                    transform: activeTab === tab.id ? 'scale(1.1)' : 'scale(1)',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  {tab.icon}
                </span>
                <span
                  className="tab-label-desktop"
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: activeTab === tab.id ? '700' : '600',
                  }}
                >
                  {tab.label}
                </span>
                <span
                  className="tab-label-mobile"
                  style={{
                    display: 'none',
                    fontSize: '0.7rem',
                    fontWeight: activeTab === tab.id ? '700' : '600',
                  }}
                >
                  {tab.mobileLabel || tab.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <div style={{ paddingTop: '24px', paddingBottom: '24px' }}>
        {activeTab === 'predictions' && <PredictionForm roundNumber={1} />}
        {activeTab === 'all-predictions' && <AllPredictions />}
        {activeTab === 'leaderboard' && <Leaderboard />}
        {activeTab === 'admin' && isAdmin() && <MatchManager />}
        {activeTab === 'rounds' && isAdmin() && <RoundManager />}
      </div>

      <style>
        {`
        @media (max-width: 767px) {
          .mobile-hidden { display: none !important; }
          .mobile-visible { display: inline !important; }
          .desktop-flex { display: none !important; }
          .mobile-menu-btn { display: block !important; }
          .tab-label-desktop { display: none; }
          .tab-label-mobile { display: inline !important; }
          .tab-button {
            min-width: 90px;
          }
        }

        @media (min-width: 768px) {
          .mobile-hidden { display: inline !important; }
          .mobile-visible { display: none !important; }
          .desktop-flex { display: flex !important; }
          .mobile-menu-btn { display: none !important; }
          .mobile-menu { display: none !important; }
          .tab-label-desktop { display: inline; }
          .tab-label-mobile { display: none !important; }
          .tab-button {
            flex-direction: row !important;
            gap: 8px !important;
          }
        }

        .tab-button:hover {
          background-color: #f0fdf4;
          transform: translateY(-1px);
        }

        .tab-button:active {
          transform: translateY(0);
        }

        .tabs-container::-webkit-scrollbar {
          height: 4px;
        }

        .tabs-container::-webkit-scrollbar-track {
          background: transparent;
        }

        .tabs-container::-webkit-scrollbar-thumb {
          background: var(--color-text-disabled);
          border-radius: 4px;
        }
      `}
      </style>
    </div>
  )
}
