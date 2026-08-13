/**
 * Las tres vistas del formulario de acceso, con sus textos y sus campos.
 *
 * Antes cada diferencia entre vistas se resolvía con los booleanos
 * `isLoginView` / `isSignupView` / `isResetView`, que aparecían quince veces
 * repartidas por el componente, más un ternario de cuatro niveles para la
 * etiqueta del botón. Con la tabla acá, agregar o cambiar una vista es tocar un
 * solo lugar.
 */
export const AUTH_VIEWS = {
  login: {
    subtitle: 'Ingresá a tu cuenta',
    action: 'Ingresar',
    loadingAction: 'Cargando...',
    needsPassword: true,
    needsProfile: false,
  },
  signup: {
    subtitle: 'Creá tu cuenta',
    action: 'Registrarse',
    loadingAction: 'Cargando...',
    needsPassword: true,
    // Nombre del equipo y nombre completo: solo al registrarse.
    needsProfile: true,
  },
  reset: {
    subtitle: 'Recuperá el acceso por email',
    action: 'Enviar enlace de recuperación',
    loadingAction: 'Enviando enlace...',
    needsPassword: false,
    needsProfile: false,
  },
}

export const getAuthView = view => AUTH_VIEWS[view] ?? AUTH_VIEWS.login

export const EMPTY_FIELD_ERRORS = {
  username: '',
  fullName: '',
  email: '',
  password: '',
  general: '',
}

/**
 * Valida los campos que la vista pide y devuelve todos los errores juntos.
 *
 * Antes se validaba en dos tramos: email y contraseña antes de arrancar el envío
 * y de a un error por vez, y los dos campos del perfil ya adentro del `try`, o sea
 * después de haber puesto el formulario en estado "enviando". Acá es una sola
 * pasada, sin efectos y con todo lo que falta a la vista.
 *
 * Se valida con `.trim()` porque los inputs son `required`: el navegador ya
 * bloquea el vacío, así que lo único que llega hasta acá son los campos con solo
 * espacios.
 *
 * @returns {object} el mapa de errores; vacío si está todo bien
 */
export const validateAuthForm = (view, { email, password, username, fullName } = {}) => {
  const config = getAuthView(view)
  const errors = { ...EMPTY_FIELD_ERRORS }

  if (!email?.trim()) errors.email = 'Ingresá tu email.'
  if (config.needsPassword && !password?.trim()) errors.password = 'Ingresá tu contraseña.'

  if (config.needsProfile) {
    if (!username?.trim()) errors.username = 'Ingresá el nombre del equipo.'
    if (!fullName?.trim()) errors.fullName = 'Ingresá tu nombre completo.'
  }

  return errors
}

/** Si un mapa de errores tiene alguno. */
export const hasErrors = errors => Object.values(errors).some(Boolean)

/** El texto del botón principal según la vista y si está esperando respuesta. */
export const getActionLabel = (view, isLoading) => {
  const config = getAuthView(view)
  return isLoading ? config.loadingAction : config.action
}

/** Segundos restantes como `mm:ss`. */
export const formatCountdown = totalSeconds => {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}
