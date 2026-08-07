import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { useTournament } from './contexts/TournamentContext'
import { useHomePath } from './hooks/useHomePath'
import ErrorBoundary from './components/Common/ErrorBoundary'
import LoadingState from './components/Common/LoadingState'
import {
  INFO_SECTIONS,
  PROFILE_PATH,
  getSectionPath,
} from './components/Navigation/pages-with-sections.config'

const PredictionForm = lazy(() => import('./components/PredictionForm'))
const AllPredictions = lazy(() => import('./components/AllPredictions'))
const Leaderboard = lazy(() => import('./components/LeaderBoard'))
const InfoPage = lazy(() => import('./components/InfoPage'))
const Playoffs = lazy(() => import('./components/Playoffs'))
const MatchManager = lazy(() => import('./components/MatchManager'))
const RoundManager = lazy(() => import('./components/RoundManager'))
const AdminMatchSchedule = lazy(() => import('./components/AdminMatchSchedule'))
const PersonalStats = lazy(() => import('./components/PersonalStats'))
const UserProfile = lazy(() => import('./components/UserProfile'))
const WorldCupPredictions = lazy(() => import('./components/WorldCupPredictions'))
const AdminWorldCupBonus = lazy(() => import('./components/AdminWorldCupBonus'))

/** Envuelve cada vista: el chunk puede fallar y Suspense no captura errores. */
const Page = ({ children }) => (
  <ErrorBoundary>
    <Suspense fallback={<LoadingState />}>{children}</Suspense>
  </ErrorBoundary>
)

/** Las secciones mundialistas solo existen en el torneo del Mundial. */
const MundialRoute = ({ children }) => {
  const { activeTournament } = useTournament()
  const homePath = useHomePath()

  if (activeTournament?.slug !== 'mundial-2026') {
    return <Navigate to={homePath} replace />
  }

  return children
}

/**
 * Administración: además del rol, un torneo finalizado es de solo lectura para
 * todos. Es un guard de UI — la autorización real depende de RLS.
 */
const AdminRoute = ({ children }) => {
  const { isAdmin } = useAuth()
  const { isReadOnly } = useTournament()
  const homePath = useHomePath()

  if (!isAdmin() || isReadOnly) {
    return <Navigate to={homePath} replace />
  }

  return children
}

/** Traduce el segmento de la URL al id de sección que espera InfoPage. */
const InfoRoute = () => {
  const { seccion } = useParams()
  const section = INFO_SECTIONS.find(item => item.path.endsWith(`/${seccion}`))

  if (!section) return <Navigate to={INFO_SECTIONS[0].path} replace />

  return (
    <Page>
      <InfoPage activeSection={section.id} />
    </Page>
  )
}

/**
 * "Ver pronósticos" de un jugador se pasa por query params en vez de por estado,
 * así el link se puede compartir y sobrevive a un refresh.
 */
const AllPredictionsRoute = () => {
  const [searchParams] = useSearchParams()
  const fecha = searchParams.get('fecha')

  return (
    <Page>
      <AllPredictions
        initialRound={fecha ? Number(fecha) : null}
        initialUser={searchParams.get('jugador') || ''}
      />
    </Page>
  )
}

const LeaderboardRoute = () => {
  const { activeTournament } = useTournament()
  const navigate = useNavigate()

  return (
    <Page>
      <Leaderboard
        includeWorldCupBonus={activeTournament?.type === 'world_cup'}
        onViewPredictions={({ userId, roundNumber }) => {
          const params = new URLSearchParams()
          if (roundNumber) params.set('fecha', String(roundNumber))
          if (userId) params.set('jugador', userId)
          navigate(`${getSectionPath('all-predictions')}?${params.toString()}`)
        }}
      />
    </Page>
  )
}

export default function AppRoutes() {
  const homePath = useHomePath()

  return (
    <Routes>
      <Route path="/" element={<Navigate to={homePath} replace />} />

      <Route
        path="/pronosticos"
        element={
          <Page>
            <PredictionForm />
          </Page>
        }
      />
      <Route
        path="/mundialistas"
        element={
          <MundialRoute>
            <Page>
              <WorldCupPredictions />
            </Page>
          </MundialRoute>
        }
      />
      <Route path="/rivales" element={<AllPredictionsRoute />} />
      <Route path="/posiciones" element={<LeaderboardRoute />} />
      <Route
        path="/playoffs"
        element={
          <Page>
            <Playoffs />
          </Page>
        }
      />

      <Route path="/reglas" element={<Navigate to={INFO_SECTIONS[0].path} replace />} />
      <Route path="/reglas/:seccion" element={<InfoRoute />} />

      <Route
        path="/estadisticas"
        element={
          <Page>
            <PersonalStats activeSection="personal" />
          </Page>
        }
      />

      <Route
        path={PROFILE_PATH}
        element={
          <Page>
            <UserProfile />
          </Page>
        }
      />

      <Route path="/admin" element={<Navigate to={getSectionPath('admin-matches')} replace />} />
      <Route
        path="/admin/partidos"
        element={
          <AdminRoute>
            <Page>
              <MatchManager />
            </Page>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/fechas"
        element={
          <AdminRoute>
            <Page>
              <RoundManager />
            </Page>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/horarios"
        element={
          <AdminRoute>
            <Page>
              <AdminMatchSchedule />
            </Page>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/mundial"
        element={
          <AdminRoute>
            <MundialRoute>
              <Page>
                <AdminWorldCupBonus />
              </Page>
            </MundialRoute>
          </AdminRoute>
        }
      />

      <Route path="*" element={<Navigate to={homePath} replace />} />
    </Routes>
  )
}
