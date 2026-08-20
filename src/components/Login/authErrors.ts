/**
 * Traducción de los errores de Supabase Auth a algo que se pueda leer.
 *
 * Los mensajes de Supabase vienen en inglés y con jerga ("Invalid login
 * credentials"), y la app es toda en español. Lo que no se traduce cae en un
 * mensaje genérico: mostrar el error crudo de la API no le sirve al usuario y de
 * paso puede filtrar detalles del backend.
 *
 * El match es por `includes` sobre el mensaje en minúsculas y no por igualdad,
 * porque Supabase le agrega contexto variable a algunos ("For security purposes,
 * you can only request this after 47 seconds").
 */
const TRANSLATIONS = [
  ['invalid login credentials', 'Email o contraseña incorrectos.'],
  ['email not confirmed', 'Todavía no confirmaste tu email.'],
  ['already registered', 'Ese email ya está registrado.'],
  ['password should be at least', 'La contraseña debe tener al menos 6 caracteres.'],
  ['for security purposes', 'Ya enviamos un enlace hace poco. Esperá unos minutos para reenviar.'],
]

export const GENERIC_AUTH_ERROR = 'Ocurrió un error. Intentá nuevamente.'

export const toSpanishAuthError = error => {
  const rawMessage = (error?.message || '').toLowerCase()
  const match = TRANSLATIONS.find(([needle]) => rawMessage.includes(needle))

  return match ? match[1] : GENERIC_AUTH_ERROR
}
