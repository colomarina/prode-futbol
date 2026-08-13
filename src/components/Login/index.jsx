import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTournament } from '../../contexts/TournamentContext'
import { getTournamentConfig } from '../../config/tournaments.config'
import Button from '../Common/Button'
import FormField from '../Common/FormField'
import IconButton from '../Common/IconButton'
import TextInput from '../Common/TextInput'
import Toast from '../Common/Toast'
import { PROFILE_PATH } from '../Navigation/pages-with-sections.config'

const RESET_COOLDOWN_MS = 5 * 60 * 1000
const RESET_COOLDOWN_STORAGE_KEY = 'auth_reset_cooldown_until'

const getInitialCooldownUntil = () => {
  if (typeof window === 'undefined') return 0

  const savedValue = Number(window.localStorage.getItem(RESET_COOLDOWN_STORAGE_KEY) || 0)
  return Number.isFinite(savedValue) ? savedValue : 0
}

const formatCountdown = totalSeconds => {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

const EMPTY_FIELD_ERRORS = {
  username: '',
  fullName: '',
  email: '',
  password: '',
  general: '',
}

const toSpanishAuthError = error => {
  const rawMessage = (error?.message || '').toLowerCase()

  if (rawMessage.includes('invalid login credentials')) {
    return 'Email o contraseña incorrectos.'
  }

  if (rawMessage.includes('email not confirmed')) {
    return 'Todavía no confirmaste tu email.'
  }

  if (rawMessage.includes('already registered')) {
    return 'Ese email ya está registrado.'
  }

  if (rawMessage.includes('password should be at least')) {
    return 'La contraseña debe tener al menos 6 caracteres.'
  }

  if (rawMessage.includes('for security purposes')) {
    return 'Ya enviamos un enlace hace poco. Esperá unos minutos para reenviar.'
  }

  return 'Ocurrió un error. Intentá nuevamente.'
}

export default function Login() {
  const [authView, setAuthView] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [fieldErrors, setFieldErrors] = useState(EMPTY_FIELD_ERRORS)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSendingReset, setIsSendingReset] = useState(false)
  const [toast, setToast] = useState(null)
  const [resetCooldownUntil, setResetCooldownUntil] = useState(getInitialCooldownUntil)
  const [nowTs, setNowTs] = useState(() => Date.now())

  const { signIn, signUp, resetPassword } = useAuth()
  const { activeTournament } = useTournament()
  const tournamentConfig = getTournamentConfig(activeTournament?.slug)
  const prodeName = tournamentConfig?.prodeName || 'Prode Chiqui Tapia'

  const isLoginView = authView === 'login'
  const isSignupView = authView === 'signup'
  const isResetView = authView === 'reset'

  const remainingResetSeconds = useMemo(() => {
    const remainingMs = resetCooldownUntil - nowTs
    return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0
  }, [resetCooldownUntil, nowTs])

  const isResetOnCooldown = remainingResetSeconds > 0

  useEffect(() => {
    if (!resetCooldownUntil) return

    const clearCooldown = () => {
      setResetCooldownUntil(0)
      window.localStorage.removeItem(RESET_COOLDOWN_STORAGE_KEY)
    }

    const msUntilExpiry = resetCooldownUntil - Date.now()

    if (msUntilExpiry <= 0) {
      clearCooldown()
      setNowTs(Date.now())
      return
    }

    const intervalId = window.setInterval(() => {
      setNowTs(Date.now())
    }, 1000)

    const timeoutId = window.setTimeout(() => {
      setNowTs(Date.now())
      clearCooldown()
    }, msUntilExpiry)

    return () => {
      window.clearInterval(intervalId)
      window.clearTimeout(timeoutId)
    }
  }, [resetCooldownUntil])

  useEffect(() => {
    setFieldErrors(EMPTY_FIELD_ERRORS)
    if (!isLoginView) {
      setShowPassword(false)
    }
  }, [authView, isLoginView])

  const loginSubtitle = useMemo(() => {
    if (isSignupView) return 'Creá tu cuenta'
    if (isResetView) return 'Recuperá el acceso por email'
    return 'Ingresá a tu cuenta'
  }, [isSignupView, isResetView])

  const handleSubmit = async e => {
    e.preventDefault()
    setFieldErrors(EMPTY_FIELD_ERRORS)

    if (!email.trim()) {
      setFieldErrors(prev => ({ ...prev, email: 'Ingresá tu email.' }))
      return
    }

    if (!isResetView && !password.trim()) {
      setFieldErrors(prev => ({ ...prev, password: 'Ingresá tu contraseña.' }))
      return
    }

    setIsSubmitting(true)

    try {
      if (isLoginView) {
        const { error } = await signIn(email, password)
        if (error) throw error
      } else {
        const nextErrors = { ...EMPTY_FIELD_ERRORS }

        if (!username.trim()) {
          nextErrors.username = 'Ingresá el nombre del equipo.'
        }

        if (!fullName.trim()) {
          nextErrors.fullName = 'Ingresá tu nombre completo.'
        }

        if (nextErrors.username || nextErrors.fullName) {
          setFieldErrors(nextErrors)
          return
        }

        const { error } = await signUp(email, password, username, fullName)
        if (error) throw error
        setToast({
          message: 'Usuario creado! Por favor verifica tu email.',
          type: 'success',
        })
      }
    } catch (error) {
      const translatedError = toSpanishAuthError(error)

      if (isLoginView) {
        setFieldErrors(prev => ({ ...prev, password: translatedError }))
      } else {
        setFieldErrors(prev => ({ ...prev, general: translatedError }))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePasswordReset = async () => {
    setFieldErrors(EMPTY_FIELD_ERRORS)

    if (!email.trim()) {
      setFieldErrors(prev => ({ ...prev, email: 'Ingresá tu email primero.' }))
      return
    }

    if (isResetOnCooldown) {
      setFieldErrors(prev => ({
        ...prev,
        email: 'Ya enviamos un enlace hace poco. Esperá unos minutos para reenviar.',
      }))
      return
    }

    setIsSendingReset(true)

    try {
      // Se arma con PROFILE_PATH y no a mano: si cambia la ruta del perfil, el
      // mail de recuperacion tiene que seguir apuntando al lugar correcto.
      const redirectTo = `${window.location.origin}${PROFILE_PATH}`
      const { error } = await resetPassword(email.trim(), redirectTo)

      if (error) throw error

      setToast({
        message: 'Te enviamos un email para restablecer tu contraseña.',
        type: 'success',
      })

      const nextCooldownUntil = Date.now() + RESET_COOLDOWN_MS
      setNowTs(Date.now())
      setResetCooldownUntil(nextCooldownUntil)
      window.localStorage.setItem(RESET_COOLDOWN_STORAGE_KEY, String(nextCooldownUntil))
    } catch (error) {
      setFieldErrors(prev => ({ ...prev, email: toSpanishAuthError(error) }))
    } finally {
      setIsSendingReset(false)
    }
  }

  const handleSubmitByView = async e => {
    if (isResetView) {
      e.preventDefault()
      await handlePasswordReset()
      return
    }

    await handleSubmit(e)
  }

  const isMainActionLoading = isSubmitting || isSendingReset
  const isMainActionDisabled =
    isMainActionLoading || (isResetView && isResetOnCooldown) || (isResetView && !email.trim())

  const mainActionLabel = isResetView
    ? isSendingReset
      ? 'Enviando enlace...'
      : 'Enviar enlace de recuperación'
    : isSubmitting
      ? 'Cargando...'
      : isLoginView
        ? 'Ingresar'
        : 'Registrarse'

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-background)',
        padding: '16px',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          padding: '24px',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-lg)',
          width: '100%',
          maxWidth: '480px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚽</div>
          <h2
            style={{
              fontSize: '1.75rem',
              fontWeight: '700',
              color: 'var(--color-primary-text)',
              marginBottom: '8px',
            }}
          >
            {prodeName}
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
            {loginSubtitle}
          </p>
        </div>

        <form
          onSubmit={handleSubmitByView}
          style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
        >
          {isSignupView && (
            <>
              <FormField label="Nombre del Equipo" error={fieldErrors.username}>
                <TextInput
                  type="text"
                  value={username}
                  onChange={e => {
                    setUsername(e.target.value)
                    if (fieldErrors.username) {
                      setFieldErrors(prev => ({ ...prev, username: '' }))
                    }
                  }}
                  required
                />
              </FormField>
              <FormField label="Nombre Completo" error={fieldErrors.fullName}>
                <TextInput
                  type="text"
                  value={fullName}
                  onChange={e => {
                    setFullName(e.target.value)
                    if (fieldErrors.fullName) {
                      setFieldErrors(prev => ({ ...prev, fullName: '' }))
                    }
                  }}
                  required
                />
              </FormField>
            </>
          )}

          <FormField label="Email" error={fieldErrors.email}>
            <TextInput
              type="email"
              value={email}
              onChange={e => {
                setEmail(e.target.value)
                if (fieldErrors.email) {
                  setFieldErrors(prev => ({ ...prev, email: '' }))
                }
              }}
              required
            />
          </FormField>

          {!isResetView && (
            <FormField label="Contraseña" error={fieldErrors.password}>
              {id => (
                <div style={{ position: 'relative' }}>
                  <TextInput
                    id={id}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value)
                      if (fieldErrors.password) {
                        setFieldErrors(prev => ({ ...prev, password: '' }))
                      }
                    }}
                    required
                    minLength={6}
                    style={{ paddingRight: '56px' }}
                  />
                  <IconButton
                    onClick={() => setShowPassword(prev => !prev)}
                    label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    aria-pressed={showPassword}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      minHeight: 'auto',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </IconButton>
                </div>
              )}
            </FormField>
          )}

          {isResetView && (
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
              Te vamos a enviar un enlace para crear una nueva contraseña.
            </p>
          )}

          <Button type="submit" disabled={isMainActionDisabled} fullWidth>
            {mainActionLabel}
          </Button>

          {isResetView && (
            <p
              style={{
                color: 'var(--color-text-secondary)',
                fontSize: '0.85rem',
                marginTop: '-8px',
              }}
            >
              {isResetOnCooldown
                ? `Podés pedir otro enlace en ${formatCountdown(remainingResetSeconds)}.`
                : 'Si no llega el correo, revisá spam o promociones.'}
            </p>
          )}

          {fieldErrors.general && <div className="form-error">{fieldErrors.general}</div>}
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', display: 'grid', gap: '10px' }}>
          {isLoginView && (
            <>
              <Button variant="outline" onClick={() => setAuthView('signup')} fullWidth>
                ¿No tenés cuenta? Registrate
              </Button>
              <Button variant="link" onClick={() => setAuthView('reset')}>
                ¿Olvidaste tu contraseña?
              </Button>
            </>
          )}

          {isSignupView && (
            <Button variant="outline" onClick={() => setAuthView('login')} fullWidth>
              ¿Ya tenés cuenta? Ingresá
            </Button>
          )}

          {isResetView && (
            <Button variant="outline" onClick={() => setAuthView('login')} fullWidth>
              Volver a ingresar
            </Button>
          )}
        </div>
      </div>

      {/* Toast notifications */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
