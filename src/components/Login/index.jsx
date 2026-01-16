import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

export default function Login() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { signIn, signUp } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        const { error } = await signIn(email, password)
        if (error) throw error
      } else {
        if (!username || !fullName) {
          throw new Error('Username y nombre completo son requeridos')
        }
        const { error } = await signUp(email, password, username, fullName)
        if (error) throw error
        alert('Usuario creado! Por favor verifica tu email.')
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-background)', padding: '16px' }}>
      <div style={{ backgroundColor: 'var(--color-surface)', padding: '24px', borderRadius: '16px', boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: '480px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚽</div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-primary)', marginBottom: '8px' }}>
            Prode Chiqui Tapia
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
            {isLogin ? 'Ingresá a tu cuenta' : 'Creá tu cuenta'}
          </p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {!isLogin && (
            <>
              <div className="form-group">
                <label className="form-label">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%' }}
          >
            {loading ? 'Cargando...' : isLogin ? 'Ingresar' : 'Registrarse'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="btn-text"
            style={{ width: '100%' }}
          >
            {isLogin
              ? '¿No tenés cuenta? Registrate'
              : '¿Ya tenés cuenta? Ingresá'}
          </button>
        </div>
      </div>
    </div>
  )
}
