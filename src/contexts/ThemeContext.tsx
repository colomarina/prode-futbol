import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { applyTournamentTheme } from '../config/tournaments.config'

export interface ThemeContextValue {
  isDark: boolean
  toggleTheme: () => void
}

/** Tipado y en `null`, por el mismo motivo que en `TournamentContext`. */
const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(() => {
    // Obtener preferencia guardada o usar preferencia del sistema
    const saved = localStorage.getItem('theme')
    if (saved) {
      return saved === 'dark'
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    // Guardar preferencia
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
    // Aplicar tema al documento
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')

    // Re-aplicar tema del torneo activo para reflejar variables light/dark del torneo
    const activeTournamentSlug = localStorage.getItem('active_tournament_slug')
    if (activeTournamentSlug) {
      applyTournamentTheme(activeTournamentSlug, isDark)
    }
  }, [isDark])

  const toggleTheme = useCallback((): void => {
    setIsDark(prev => !prev)
  }, [])

  // Mismo motivo que en TournamentContext: el objeto literal inline creaba una
  // referencia nueva por render y obligaba a re-renderizar a los consumidores.
  const value = useMemo(() => ({ isDark, toggleTheme }), [isDark, toggleTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme debe ser usado dentro de ThemeProvider')
  }
  return context
}
