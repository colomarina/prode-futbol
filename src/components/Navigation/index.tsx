import { useCallback, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTournament } from '../../contexts/TournamentContext'
import { useMatchesMeta } from '../../hooks/useMatchesMeta'
import { hasPlayoffMatches } from '../../utils/leaderboardRounds'
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

  // La llave de playoffs no aporta nada si el torneo no tiene partidos de
  // playoff cargados: el tab llevaba a una pantalla vacía. La consulta la
  // comparten `useRounds` y compañía, así que sale del cache.
  const { matchesMeta } = useMatchesMeta(activeTournament?.id)
  const showPlayoffsTab = useMemo(() => hasPlayoffMatches(matchesMeta), [matchesMeta])

  const tabsToShow = useMemo(() => {
    const sections = getViewSections(viewId)
    // Sin secciones no hay tabs: la navegación de nivel superior vive en el
    // menú hamburguesa.
    if (!sections) return []

    return sections.filter(section => {
      if (!isMundial2026 && MUNDIAL_ONLY_SECTIONS.has(section.id)) return false
      if (section.id === 'playoffs' && !showPlayoffsTab) return false
      return true
    })
  }, [viewId, isMundial2026, showPlayoffsTab])

  const handleNavigationFromMenu = useCallback(
    (targetViewId: string) => {
      const path = getViewDefaultPath(targetViewId)
      if (path) navigate(path)
    },
    [navigate]
  )

  const handleTabChange = useCallback(
    (tabId: string) => {
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
          zIndex: 'var(--z-modal)',
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
      <div style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-xl)' }}>
        <div role="tabpanel" aria-labelledby={`tab-${sectionId || viewId}`}>
          <AppRoutes />
        </div>
      </div>
    </div>
  )
}
