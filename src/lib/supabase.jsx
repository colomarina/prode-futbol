import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY

/**
 * Variables de entorno que faltan, para que la app pueda avisarlo en pantalla.
 * @type {string[]}
 */
export const missingSupabaseEnvVars = [
  supabaseUrl ? null : 'VITE_SUPABASE_URL',
  supabaseAnonKey ? null : 'VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY',
].filter(Boolean)

// createClient tira "supabaseUrl is required." si recibe undefined, y como esto
// corre al evaluar el modulo (antes de que React monte) el resultado era una
// pantalla en blanco sin ningun mensaje: ni el ErrorBoundary llegaba a existir.
// Con los placeholders el modulo carga, la app monta y App muestra que falta.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.invalid',
  supabaseAnonKey || 'placeholder-key'
)
