import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom'
import { useAuth, AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { TournamentProvider, useTournament } from './contexts/TournamentContext'
import { getTournamentConfig } from './config/tournaments.config'
import Login from './components/Login'
import Navigation from './components/Navigation'
import TournamentSelector from './components/TournamentSelector'
import ErrorBoundary from './components/Common/ErrorBoundary'
import ConfigError from './components/Common/ConfigError'
import { missingSupabaseEnvVars } from './lib/supabase'
import { createQueryClient } from './lib/queryClient'
import { filterVisibleTournaments, isTestTournament } from './utils/tournamentAccess'
import { PROFILE_PATH } from './components/Navigation/pages-with-sections.config'

// Lazy + solo en dev: en produccion el chunk no se pide nunca.
const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/react-query-devtools').then(m => ({ default: m.ReactQueryDevtools }))
    )
  : null

// Optional switch:
// - false (default): only active tournaments are accessible to everyone.
// - true: admins can also access upcoming tournaments.
const ALLOW_UPCOMING_FOR_ADMINS =
  import.meta.env.VITE_ALLOW_UPCOMING_TOURNAMENTS_FOR_ADMINS === 'true'

function AppContent() {
  const { user, loading, isAdmin } = useAuth()
  const {
    tournaments,
    activeTournament,
    setActiveTournament,
    loading: tournamentLoading,
  } = useTournament()
  const tournamentConfig = getTournamentConfig(activeTournament?.slug)
  const location = useLocation()
  const navigate = useNavigate()
  // Antes esto leia window.location fuera de React, asi que ante un popstate se
  // re-renderizaba Navigation pero no App y el gating quedaba desactualizado.
  const isProfileRoute = location.pathname.startsWith(PROFILE_PATH)

  const isUserAdmin = isAdmin()

  const canAccessTournament = useCallback(
    tournament => {
      if (!tournament) return false
      // Los torneos de prueba quedan activos para poder escribir en ellos, asi
      // que el unico filtro es este: fuera de los admins, no existen.
      if (isTestTournament(tournament) && !isUserAdmin) return false
      if (tournament.status === 'active') return true
      // Los torneos terminados quedan accesibles en modo consulta (ver isReadOnly en TournamentContext)
      if (tournament.status === 'finished') return true
      if (ALLOW_UPCOMING_FOR_ADMINS && isUserAdmin && tournament.status === 'upcoming') return true
      return false
    },
    [isUserAdmin]
  )

  // Los de prueba no se muestran deshabilitados: directamente no se listan.
  const visibleTournaments = useMemo(
    () => filterVisibleTournaments(tournaments, isUserAdmin),
    [tournaments, isUserAdmin]
  )

  const handleSelectTournament = useCallback(
    tournament => {
      if (!canAccessTournament(tournament)) return
      setActiveTournament(tournament)
    },
    [canAccessTournament, setActiveTournament]
  )

  // Safety guard: if someone forces a blocked tournament (e.g. localStorage), clear it.
  //
  // Se espera a que termine de cargar la sesion: el efecto corre en cada render,
  // tambien mientras la pantalla muestra el spinner. Si la lista de torneos
  // resolvia antes que el perfil, `isAdmin()` todavia era false —`profile` es
  // null— y un torneo de prueba se veia como inaccesible: el guard lo limpiaba y
  // borraba `active_tournament_slug`, asi que al admin lo devolvia al selector en
  // cada recarga y le perdia la preferencia.
  useEffect(() => {
    if (loading) return
    if (!activeTournament) return
    if (!canAccessTournament(activeTournament)) {
      setActiveTournament(null)
    }
  }, [activeTournament, canAccessTournament, setActiveTournament, loading])

  useEffect(() => {
    const defaultTitle = 'Prode Chiqui Tapia'

    if (!activeTournament) {
      document.title = defaultTitle
      return
    }

    const tournamentName = activeTournament.name || tournamentConfig?.label || 'Torneo'
    const prodeName = tournamentConfig?.prodeName || defaultTitle
    document.title = `${prodeName} | ${tournamentName}`
  }, [activeTournament, tournamentConfig?.label, tournamentConfig?.prodeName])

  // Al cerrar sesion se vuelve a la raiz: quedarse en una URL interna haria que
  // al volver a entrar se aterrice en una pantalla que quizas ya no corresponde.
  useEffect(() => {
    if (loading) return

    if (!user && location.pathname !== '/') {
      navigate('/', { replace: true })
    }
  }, [user, loading, location.pathname, navigate])

  if (loading || tournamentLoading) {
    return (
      <div
        className="loading-container"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              margin: '0 auto 20px',
              border: '4px solid rgba(30, 127, 67, 0.1)',
              borderTop: '4px solid var(--color-primary)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <p
            style={{
              color: 'var(--color-text-secondary)',
              fontSize: '1rem',
              fontWeight: '500',
            }}
          >
            Cargando...
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  // Profile route can render without selecting a tournament first
  if (isProfileRoute) {
    return <Navigation />
  }

  // User logged in but no tournament selected and tournaments loaded
  if (!activeTournament && visibleTournaments.length > 0) {
    return (
      <TournamentSelector
        tournaments={visibleTournaments}
        loading={tournamentLoading}
        onSelect={handleSelectTournament}
        isTournamentDisabled={tournament => !canAccessTournament(tournament)}
      />
    )
  }

  // User logged in and tournament selected
  if (activeTournament && canAccessTournament(activeTournament)) {
    return <Navigation />
  }

  // Fallback: no accessible tournaments for this user
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-text-secondary)',
      }}
    >
      No hay torneos habilitados para tu cuenta
    </div>
  )
}

function App() {
  // Se crea una sola vez por montaje de la app: si se instanciara en el cuerpo
  // del componente, cada render tiraria el cache entero a la basura.
  const [queryClient] = useState(createQueryClient)

  // Antes que los providers: sin credenciales de Supabase no hay nada que
  // renderizar, y todos ellos intentarian consultar apenas montan.
  if (missingSupabaseEnvVars.length > 0) {
    return <ConfigError missingVars={missingSupabaseEnvVars} />
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeProvider>
            <TournamentProvider>
              <AuthProvider>
                <AppContent />
              </AuthProvider>
            </TournamentProvider>
          </ThemeProvider>
        </BrowserRouter>
        {ReactQueryDevtools && (
          <Suspense fallback={null}>
            <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
          </Suspense>
        )}
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
