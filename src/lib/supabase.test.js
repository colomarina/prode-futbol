import { describe, it, expect, afterEach, vi } from 'vitest'

// El modulo calcula todo al evaluarse, asi que cada caso necesita reimportarlo
// con las env vars ya stubbeadas.
const importFresh = async () => {
  vi.resetModules()
  return import('./supabase')
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('cliente de supabase', () => {
  it('no explota al importarse sin variables de entorno', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY', '')

    // Antes esto tiraba "supabaseUrl is required." al evaluar el modulo, y como
    // pasa antes de que React monte el resultado era una pantalla en blanco.
    const mod = await importFresh()

    expect(mod.supabase).toBeDefined()
    expect(mod.missingSupabaseEnvVars).toEqual([
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY',
    ])
  })

  it('reporta solo la variable que falta', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://ejemplo.supabase.co')
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY', '')

    const mod = await importFresh()

    expect(mod.missingSupabaseEnvVars).toEqual(['VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY'])
  })

  it('no reporta nada cuando estan las dos', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://ejemplo.supabase.co')
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY', 'una-key')

    const mod = await importFresh()

    expect(mod.missingSupabaseEnvVars).toEqual([])
    expect(mod.supabase).toBeDefined()
  })
})
