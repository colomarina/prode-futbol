import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTournament } from '../../contexts/TournamentContext'
import { useResetCooldown } from '../../hooks/useResetCooldown'
import { getTournamentConfig } from '../../config/tournaments.config'
import Button from '../Common/Button'
import FormField from '../Common/FormField'
import PasswordInput from '../Common/PasswordInput'
import TextInput from '../Common/TextInput'
import Toast from '../Common/Toast'
import { PROFILE_PATH } from '../Navigation/pages-with-sections.config'
import { toSpanishAuthError } from './authErrors'
import {
  getAuthView,
  getActionLabel,
  validateAuthForm,
  hasErrors,
  formatCountdown,
  EMPTY_FIELD_ERRORS,
} from './authViews'
import styles from './Login.module.css'

/** Los botones para cambiar de vista, por vista. */
const SWITCHERS = {
  login: [
    { to: 'signup', label: '¿No tenés cuenta? Registrate', variant: 'outline', fullWidth: true },
    { to: 'reset', label: '¿Olvidaste tu contraseña?', variant: 'link' },
  ],
  signup: [
    { to: 'login', label: '¿Ya tenés cuenta? Ingresá', variant: 'outline', fullWidth: true },
  ],
  reset: [{ to: 'login', label: 'Volver a ingresar', variant: 'outline', fullWidth: true }],
}

/**
 * Ingresar, registrarse y pedir el enlace de recuperación.
 *
 * Las tres son la misma pantalla con distintos campos, así que en vez de partirla
 * en tres componentes que repetirían el email, el botón y la tarjeta, lo que se
 * fue afuera son las decisiones: los textos y qué campos pide cada vista a
 * `authViews.js`, la traducción de errores a `authErrors.js` y la espera entre
 * pedidos a `useResetCooldown`. Los tres tienen tests.
 */
export default function Login() {
  const [view, setView] = useState('login')
  const [values, setValues] = useState({ email: '', password: '', username: '', fullName: '' })
  const [fieldErrors, setFieldErrors] = useState(EMPTY_FIELD_ERRORS)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState(null)

  const { signIn, signUp, resetPassword } = useAuth()
  const { activeTournament } = useTournament()
  const { remainingSeconds, isOnCooldown, start: startCooldown } = useResetCooldown()

  const config = getAuthView(view)
  const isResetView = view === 'reset'
  const prodeName = getTournamentConfig(activeTournament?.slug)?.prodeName || 'Prode Chiqui Tapia'

  // Los errores son de la vista que los produjo: al cambiar de vista se limpian.
  useEffect(() => {
    setFieldErrors(EMPTY_FIELD_ERRORS)
  }, [view])

  /** Actualiza un campo y borra su error, si tenía. */
  const setField = (name, value) => {
    setValues(prev => ({ ...prev, [name]: value }))
    setFieldErrors(prev => (prev[name] ? { ...prev, [name]: '' } : prev))
  }

  const handleSubmit = async event => {
    event.preventDefault()

    const errors = validateAuthForm(view, values)
    if (hasErrors(errors)) {
      setFieldErrors(errors)
      return
    }

    if (isResetView && isOnCooldown) {
      setFieldErrors({
        ...EMPTY_FIELD_ERRORS,
        email: 'Ya enviamos un enlace hace poco. Esperá unos minutos para reenviar.',
      })
      return
    }

    setFieldErrors(EMPTY_FIELD_ERRORS)
    setIsSubmitting(true)

    try {
      if (view === 'login') {
        const { error } = await signIn(values.email, values.password)
        if (error) throw error
      } else if (view === 'signup') {
        const { error } = await signUp(
          values.email,
          values.password,
          values.username,
          values.fullName
        )
        if (error) throw error
        setToast({ message: 'Usuario creado! Por favor verifica tu email.', type: 'success' })
      } else {
        // Se arma con PROFILE_PATH y no a mano: si cambia la ruta del perfil, el
        // mail de recuperación tiene que seguir apuntando al lugar correcto.
        const { error } = await resetPassword(
          values.email.trim(),
          `${window.location.origin}${PROFILE_PATH}`
        )
        if (error) throw error

        setToast({
          message: 'Te enviamos un email para restablecer tu contraseña.',
          type: 'success',
        })
        startCooldown()
      }
    } catch (error) {
      const message = toSpanishAuthError(error)
      // En login el error es del par email/contraseña y se muestra bajo la
      // contraseña; en las otras vistas no hay un campo al que atribuirlo.
      const field = view === 'login' ? 'password' : isResetView ? 'email' : 'general'
      setFieldErrors({ ...EMPTY_FIELD_ERRORS, [field]: message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isDisabled = isSubmitting || (isResetView && (isOnCooldown || !values.email.trim()))

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo} aria-hidden="true">
            ⚽
          </div>
          <h2 className={styles.title}>{prodeName}</h2>
          <p className={styles.subtitle}>{config.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {config.needsProfile && (
            <>
              <FormField label="Nombre del Equipo" error={fieldErrors.username}>
                <TextInput
                  type="text"
                  value={values.username}
                  onChange={event => setField('username', event.target.value)}
                  required
                />
              </FormField>
              <FormField label="Nombre Completo" error={fieldErrors.fullName}>
                <TextInput
                  type="text"
                  value={values.fullName}
                  onChange={event => setField('fullName', event.target.value)}
                  required
                />
              </FormField>
            </>
          )}

          <FormField label="Email" error={fieldErrors.email}>
            <TextInput
              type="email"
              value={values.email}
              onChange={event => setField('email', event.target.value)}
              required
            />
          </FormField>

          {config.needsPassword && (
            <FormField label="Contraseña" error={fieldErrors.password}>
              {id => (
                <PasswordInput
                  // La `key` reinicia el ojo al cambiar de vista: una contraseña
                  // que quedó visible no debería seguirlo estando en otra pantalla.
                  key={view}
                  id={id}
                  value={values.password}
                  onChange={event => setField('password', event.target.value)}
                  required
                  minLength={6}
                />
              )}
            </FormField>
          )}

          {isResetView && (
            <p className={styles.hint}>
              Te vamos a enviar un enlace para crear una nueva contraseña.
            </p>
          )}

          <Button type="submit" disabled={isDisabled} fullWidth>
            {getActionLabel(view, isSubmitting)}
          </Button>

          {isResetView && (
            <p className={styles.actionHint}>
              {isOnCooldown
                ? `Podés pedir otro enlace en ${formatCountdown(remainingSeconds)}.`
                : 'Si no llega el correo, revisá spam o promociones.'}
            </p>
          )}

          {fieldErrors.general && <div className="form-error">{fieldErrors.general}</div>}
        </form>

        <div className={styles.switcher}>
          {SWITCHERS[view].map(({ to, label, variant, fullWidth }) => (
            <Button key={to} variant={variant} fullWidth={fullWidth} onClick={() => setView(to)}>
              {label}
            </Button>
          ))}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
