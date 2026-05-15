import { useCallback, useEffect } from 'react'
import { useAuth, AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { TournamentProvider, useTournament } from './contexts/TournamentContext'
import Login from './components/Login'
import Navigation from './components/Navigation'
import TournamentSelector from './components/TournamentSelector'
// import PredictionForm from './components/PredictionForm'

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

  const isUserAdmin = isAdmin()

  const canAccessTournament = useCallback(
    tournament => {
      if (!tournament) return false
      if (tournament.status === 'active') return true
      if (ALLOW_UPCOMING_FOR_ADMINS && isUserAdmin && tournament.status === 'upcoming') return true
      return false
    },
    [isUserAdmin]
  )

  // const accessibleTournaments = useMemo(
  //   () => tournaments.filter(canAccessTournament),
  //   [tournaments, canAccessTournament]
  // )

  const handleSelectTournament = useCallback(
    tournament => {
      if (!canAccessTournament(tournament)) return
      setActiveTournament(tournament)
    },
    [canAccessTournament, setActiveTournament]
  )

  // Safety guard: if someone forces a blocked tournament (e.g. localStorage), clear it.
  useEffect(() => {
    if (!activeTournament) return
    if (!canAccessTournament(activeTournament)) {
      setActiveTournament(null)
    }
  }, [activeTournament, canAccessTournament, setActiveTournament])

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

  // User logged in but no tournament selected and tournaments loaded
  if (!activeTournament && tournaments.length > 0) {
    return (
      <TournamentSelector
        tournaments={tournaments}
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
  return (
    <ThemeProvider>
      <TournamentProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </TournamentProvider>
    </ThemeProvider>
  )
}

export default App
