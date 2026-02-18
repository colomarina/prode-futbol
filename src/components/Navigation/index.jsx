import { useState, useMemo, lazy, Suspense } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { ALL_TABS } from './tabs.config'
import NavHeader from './NavHeader'
import NavTabs from './NavTabs'

// Lazy loading de componentes de contenido
const PredictionForm = lazy(() => import('../PredictionForm'))
const AllPredictions = lazy(() => import('../AllPredictions'))
const Leaderboard = lazy(() => import('../LeaderBoard'))
const Info = lazy(() => import('../Info'))
const MatchManager = lazy(() => import('../MatchManager'))
const RoundManager = lazy(() => import('../RoundManager'))

export default function Navigation() {
  const [activeTab, setActiveTab] = useState('predictions')
  const [allPredictionsSelection, setAllPredictionsSelection] = useState({
    roundNumber: null,
    userId: '',
  })
  const { profile, isAdmin, signOut } = useAuth()

  // Filtrar tabs visibles según permisos
  const visibleTabs = useMemo(() => ALL_TABS.filter(tab => !tab.adminOnly || isAdmin()), [isAdmin])

  const renderContent = () => {
    switch (activeTab) {
      case 'predictions':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <PredictionForm roundNumber={1} />
          </Suspense>
        )
      case 'all-predictions':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <AllPredictions
              initialRound={allPredictionsSelection.roundNumber}
              initialUser={allPredictionsSelection.userId}
            />
          </Suspense>
        )
      case 'leaderboard':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <Leaderboard
              onViewPredictions={({ userId, roundNumber }) => {
                setAllPredictionsSelection({ roundNumber, userId })
                setActiveTab('all-predictions')
              }}
            />
          </Suspense>
        )
      case 'info':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <Info />
          </Suspense>
        )
      case 'admin':
        return isAdmin() ? (
          <Suspense fallback={<LoadingSpinner />}>
            <MatchManager />
          </Suspense>
        ) : null
      case 'rounds':
        return isAdmin() ? (
          <Suspense fallback={<LoadingSpinner />}>
            <RoundManager />
          </Suspense>
        ) : null
      default:
        return null
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-background)' }}>
      {/* Header - Mobile First */}
      <nav
        style={{
          backgroundColor: 'var(--color-surface)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div className="container">
          <NavHeader profile={profile} isAdmin={isAdmin} signOut={signOut} />

          {/* Tabs - Responsive */}
          <NavTabs tabs={visibleTabs} activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
      </nav>

      {/* Content */}
      <div style={{ paddingTop: '24px', paddingBottom: '24px' }}>
        <div role="tabpanel" aria-labelledby={`tab-${activeTab}`} id={`panel-${activeTab}`}>
          {renderContent()}
        </div>
      </div>

      <NavigationStyles />
    </div>
  )
}

function LoadingSpinner() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        padding: '40px',
      }}
      aria-label="Cargando contenido"
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          border: '3px solid #f3f3f3',
          borderTop: '3px solid var(--color-primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
    </div>
  )
}

function NavigationStyles() {
  return (
    <style>
      {`
        @media (max-width: 1199px) {
          .mobile-hidden { display: none !important; }
          .mobile-visible { display: inline !important; }
          .desktop-flex { display: none !important; }
          .mobile-menu-btn { display: block !important; }
          .tab-label-desktop { display: none; }
          .tab-label-mobile { display: inline !important; }
          .tab-button {
            min-width: 90px;
          }
          .desktop-title { display: none !important; }
          .mobile-title { display: inline !important; }

          /* Cuando hay más de 3 tabs, mostrar solo iconos */
          .tabs-compact .tab-label-mobile { display: none !important; }
          .tabs-compact .tab-button {
            min-width: 60px;
            padding: 8px 4px;
          }
          .tabs-compact .tab-button span:first-child {
            font-size: 1.5rem;
          }
        }

        @media (min-width: 1200px) {
          .mobile-hidden { display: inline !important; }
          .mobile-visible { display: none !important; }
          .desktop-flex { display: flex !important; align-items: center; }
          .mobile-menu-btn { display: none !important; }
          .mobile-menu { display: none !important; }
          .tab-label-desktop { display: inline; }
          .tab-label-mobile { display: none !important; }
          .tab-button {
            flex-direction: row !important;
            gap: 8px !important;
          }
          .desktop-title { display: inline !important; }
          .mobile-title { display: none !important; }
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

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}
    </style>
  )
}
