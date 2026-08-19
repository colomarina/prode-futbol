import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import TextInput from '../Common/TextInput'
import PasswordInput from '../Common/PasswordInput'
import Toast from '../Common/Toast'
import styles from './UserProfile.module.css'

const MIN_USERNAME_LENGTH = 3
const MAX_USERNAME_LENGTH = 30

const hasInvalidUsernameChars = value => /[^\p{L}\p{N} ]/u.test(value)

const normalizeProfileValue = value => value?.trim() ?? ''

const validateUsername = value => {
  const normalized = normalizeProfileValue(value)

  if (normalized.length < MIN_USERNAME_LENGTH) {
    return 'El nombre del equipo debe tener al menos 3 caracteres.'
  }

  if (normalized.length > MAX_USERNAME_LENGTH) {
    return 'El nombre del equipo no puede superar los 30 caracteres.'
  }

  if (hasInvalidUsernameChars(normalized)) {
    return 'El nombre del equipo solo puede tener letras, números y espacios.'
  }

  if (normalized.startsWith(' ') || normalized.endsWith(' ') || normalized.includes('  ')) {
    return 'El nombre del equipo no puede empezar, terminar ni repetir espacios seguidos.'
  }

  return null
}

export default function UserProfile() {
  const { profile, user, updateProfile, changePassword, signOut, isPasswordRecovery } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)

  useEffect(() => {
    setUsername(profile?.username ?? '')
    setFullName(profile?.full_name ?? '')
  }, [profile])

  const hasProfileChanges = useMemo(() => {
    const currentUsername = normalizeProfileValue(profile?.username)
    const currentFullName = normalizeProfileValue(profile?.full_name)

    return username.trim() !== currentUsername || fullName.trim() !== currentFullName
  }, [username, fullName, profile])

  const handleSaveProfile = async event => {
    event.preventDefault()
    setError('')

    const normalizedUsername = username.trim()
    const normalizedFullName = fullName.trim()
    const usernameError = validateUsername(normalizedUsername)

    if (usernameError) {
      setError(usernameError)
      return
    }

    if (!hasProfileChanges) {
      setError('No hiciste cambios para guardar.')
      return
    }

    setSavingProfile(true)

    try {
      const { error: updateError } = await updateProfile({
        username: normalizedUsername,
        full_name: normalizedFullName,
      })

      if (updateError) {
        // `code` solo existe en el error de PostgREST, no en un `Error` propio: el
        // `in` es lo que permite leerlo sin castear. 23505 es unique_violation.
        if ('code' in updateError && updateError.code === '23505') {
          throw new Error('Ese nombre de equipo ya está en uso.')
        }

        throw updateError
      }

      setToast({
        message: 'Perfil actualizado correctamente.',
        type: 'success',
      })
    } catch (updateError) {
      setError(updateError.message)
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async event => {
    event.preventDefault()
    setError('')

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setSavingPassword(true)

    try {
      const { error: passwordError } = await changePassword(newPassword)

      if (passwordError) throw passwordError

      setNewPassword('')
      setConfirmPassword('')

      if (isPasswordRecovery) {
        setToast({
          message: 'Contraseña actualizada. Ya podés ingresar con tu nueva clave.',
          type: 'success',
        })
        await signOut()
        navigate('/', { replace: true })
        return
      }

      setToast({
        message: 'Contraseña actualizada correctamente.',
        type: 'success',
      })
    } catch (passwordError) {
      setError(passwordError.message)
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroBadge}>⚽ Mi Perfil</div>
        <h2>Gestioná tu cuenta y los datos de tu equipo</h2>
        <p>
          Desde acá podés cambiar el nombre del equipo, actualizar tu nombre completo y renovar la
          contraseña de acceso.
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {isPasswordRecovery && (
        <div className="alert alert-warning">
          Estás en modo de restablecimiento de contraseña. Primero elegí una nueva clave y luego
          volvé a ingresar.
        </div>
      )}

      <div className={styles.grid}>
        <section className={styles.card}>
          <div className={styles.sectionHeader}>
            <h3>Datos del equipo</h3>
            <p>Se guardan en la tabla profiles.</p>
          </div>

          <form className={styles.form} onSubmit={handleSaveProfile}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="profile-email">
                Email de acceso
              </label>
              <TextInput id="profile-email" type="email" value={user?.email ?? ''} disabled />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="profile-username">
                Nombre del equipo
              </label>
              <TextInput
                id="profile-username"
                type="text"
                value={username}
                onChange={event => setUsername(event.target.value)}
                placeholder="Ej: Estero Hondo"
                maxLength={MAX_USERNAME_LENGTH}
                required
              />
              <div className={styles.helper}>
                3 a 30 caracteres. Solo letras, números y espacios.
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="profile-full-name">
                Nombre completo
              </label>
              <TextInput
                id="profile-full-name"
                type="text"
                value={fullName}
                onChange={event => setFullName(event.target.value)}
                placeholder="Ej: Ezequiel Martinez"
              />
              <div className={styles.helper}>Opcional. Si lo dejás vacío, se guarda como nulo.</div>
            </div>

            <button type="submit" className={styles.primaryButton} disabled={savingProfile}>
              {savingProfile ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </form>
        </section>

        <section className={styles.card}>
          <div className={styles.sectionHeader}>
            <h3>{isPasswordRecovery ? 'Definir nueva contraseña' : 'Cambiar contraseña'}</h3>
            <p>
              {isPasswordRecovery
                ? 'Usá este bloque para terminar el flujo de recuperación.'
                : 'La nueva contraseña se aplica a tu cuenta autenticada.'}
            </p>
          </div>

          <form className={styles.form} onSubmit={handleChangePassword}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="new-password">
                Nueva contraseña
              </label>
              <PasswordInput
                id="new-password"
                value={newPassword}
                onChange={event => setNewPassword(event.target.value)}
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="confirm-password">
                Confirmar contraseña
              </label>
              <PasswordInput
                id="confirm-password"
                value={confirmPassword}
                onChange={event => setConfirmPassword(event.target.value)}
                placeholder="Repetí la nueva contraseña"
                minLength={6}
                required
              />
            </div>

            <button type="submit" className={styles.secondaryButton} disabled={savingPassword}>
              {savingPassword ? 'Actualizando...' : 'Cambiar contraseña'}
            </button>
          </form>
        </section>
      </div>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  )
}
