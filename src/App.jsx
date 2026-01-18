import { useAuth, AuthProvider } from './contexts/AuthContext'
import Login from './components/Login'
import Navigation from './components/Navigation'
// import PredictionForm from './components/PredictionForm'

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="spinner" />
          <p className="loading-text">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return <Navigation />
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
