import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { applyTournamentTheme } from '../config/tournaments.config'
import type { Tournament } from '../types/domain'

export interface TournamentContextValue {
  tournaments: Tournament[]
  activeTournament: Tournament | null
  setActiveTournament: (tournament: Tournament | null) => void
  applyTheme: (slug: string, isDark: boolean) => void
  loading: boolean
  /** Torneo cerrado a escrituras. Es la única definición de "modo consulta". */
  isReadOnly: boolean
}

/**
 * El default es `null` y está tipado.
 *
 * Antes era `createContext()` sin argumento, y eso tipaba el contexto como
 * `undefined`: después del `if (!context) throw` de abajo el tipo quedaba en
 * `never`, así que **cualquier** propiedad que se le pidiera compilaba. No era una
 * falta de tipos, era un tipo que aceptaba todo, que es peor: `useHomePath` leía
 * `isReadOnly` sin que nada lo verificara.
 */
const TournamentContext = createContext<TournamentContextValue | null>(null)

export const TournamentProvider = ({ children }: { children: ReactNode }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [activeTournament, setActiveTournamentState] = useState<Tournament | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch tournaments from Supabase on mount
  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('tournaments')
          .select('*')
          .order('created_at', { ascending: true })

        if (error) throw error

        setTournaments(data || [])

        // Restore from localStorage if available
        const savedSlug = localStorage.getItem('active_tournament_slug')
        if (savedSlug && data) {
          const tournament = data.find(t => t.slug === savedSlug)
          if (tournament) {
            setActiveTournamentState(tournament)
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
            // Se llama a la función importada y no al wrapper del contexto para
            // que este efecto siga corriendo una sola vez, al montar.
            applyTournamentTheme(tournament.slug, isDark)
          }
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error fetching tournaments:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTournaments()
  }, [])

  /** Elige el torneo activo y aplica su tema. `null` lo limpia. */
  const setActiveTournament = useCallback((tournament: Tournament | null): void => {
    if (!tournament) {
      setActiveTournamentState(null)
      localStorage.removeItem('active_tournament_slug')
      return
    }

    setActiveTournamentState(tournament)
    localStorage.setItem('active_tournament_slug', tournament.slug)

    // Apply theme based on current data-theme
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
    applyTournamentTheme(tournament.slug, isDark)
  }, [])

  /** Aplica el tema del torneo en el root del documento. */
  const applyTheme = useCallback((slug: string, isDark: boolean): void => {
    applyTournamentTheme(slug, isDark)
  }, [])

  // Modo consulta: el torneo se puede navegar pero no admite ninguna escritura.
  // Se define por descarte (!== 'active') y no por igualdad contra 'finished' para que
  // cualquier estado que se agregue a futuro sea de solo lectura por defecto.
  const isReadOnly = Boolean(activeTournament) && activeTournament.status !== 'active'

  // Sin useMemo esto es un objeto nuevo en cada render del provider, y como lo
  // consumen ~15 componentes mas varios hooks, re-renderizaba el arbol entero.
  const value = useMemo(
    () => ({
      tournaments,
      activeTournament,
      setActiveTournament,
      applyTheme,
      loading,
      isReadOnly,
    }),
    [tournaments, activeTournament, setActiveTournament, applyTheme, loading, isReadOnly]
  )

  return <TournamentContext.Provider value={value}>{children}</TournamentContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTournament = (): TournamentContextValue => {
  const context = useContext(TournamentContext)
  if (!context) {
    throw new Error('useTournament must be used within TournamentProvider')
  }
  return context
}
