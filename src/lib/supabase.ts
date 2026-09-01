import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY

/**
 * Variables de entorno que faltan, para que la app pueda avisarlo en pantalla.
 *
 * El predicado del filtro no es adorno: `.filter(Boolean)` no le dice nada a
 * TypeScript, que seguiría viendo `(string | null)[]` y dejaría pasar un null al
 * consumidor.
 */
export const missingSupabaseEnvVars: string[] = [
  supabaseUrl ? null : 'VITE_SUPABASE_URL',
  supabaseAnonKey ? null : 'VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY',
].filter((name): name is string => name !== null)

// createClient tira "supabaseUrl is required." si recibe undefined, y como esto
// corre al evaluar el modulo (antes de que React monte) el resultado era una
// pantalla en blanco sin ningun mensaje: ni el ErrorBoundary llegaba a existir.
// Con los placeholders el modulo carga, la app monta y App muestra que falta.
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.invalid',
  supabaseAnonKey || 'placeholder-key'
)
