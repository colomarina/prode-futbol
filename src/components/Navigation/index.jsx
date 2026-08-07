import { useCallback, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTournament } from '../../contexts/TournamentContext'
import {
  getSectionPath,
  getViewDefaultPath,
  getViewSections,
  resolveRoute,
} from './pages-with-sections.config'
import NavHeader from './NavHeader'
import NavTabs from './NavTabs'
import AppRoutes from '../../routes'

/** Secciones que solo existen en el torneo del Mundial. */
const MUNDIAL_ONLY_SECTIONS = new Set(['world-cup-predictions', 'admin-world-cup'])

/**
 * Shell de la app: header, tabs y el área de contenido.
 *
 * Ya no decide qué renderizar —eso lo hace el router—, solo deriva de la URL
 * qué vista y qué sección están activas para pintar los tabs.
 */
export default function Navigation() {
  const { profile, signOut } = useAuth()
  const { activeTournament } = useTournament()
  const location = useLocation()
  const navigate = useNavigate()

  const isMundial2026 = activeTournament?.slug === 'mundial-2026'
  const { viewId, sectionId } = useMemo(() => resolveRoute(location.pathname), [location.pathname])

  const tabsToShow = useMemo(() => {
    const sections = getViewSections(viewId)
    // Sin secciones no hay tabs: la navegación de nivel superior vive en el
    // menú hamburguesa.
    if (!sections) return []

    if (isMundial2026) return sections

    return sections.filter(section => !MUNDIAL_ONLY_SECTIONS.has(section.id))
  }, [viewId, isMundial2026])

  const handleNavigationFromMenu = useCallback(
    targetViewId => {
      const path = getViewDefaultPath(targetViewId)
      if (path) navigate(path)
    },
    [navigate]
  )

  const handleTabChange = useCallback(
    tabId => {
      const path = getSectionPath(tabId)
      if (path) navigate(path)
    },
    [navigate]
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-background)' }}>
      {/* Header - Mobile First */}
      <nav
        style={{
          backgroundColor: 'var(--color-surface)',
          position: 'sticky',
          top: 0,
          zIndex: 1100,
        }}
      >
        <div className="container">
          <NavHeader profile={profile} onNavigate={handleNavigationFromMenu} signOut={signOut} />

          {tabsToShow.length > 0 && (
            <NavTabs tabs={tabsToShow} activeTab={sectionId} setActiveTab={handleTabChange} />
          )}
        </div>
      </nav>

      {/* Content */}
      <div style={{ paddingTop: '24px', paddingBottom: '24px' }}>
        <div role="tabpanel" aria-labelledby={`tab-${sectionId || viewId}`}>
          <AppRoutes />
        </div>
      </div>

      <NavigationStyles />
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
          background-color: var(--color-surface-highlight);
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
