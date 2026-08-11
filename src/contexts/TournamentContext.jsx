import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { applyTournamentTheme } from '../config/tournaments.config.js'

const TournamentContext = createContext()

export const TournamentProvider = ({ children }) => {
  const [tournaments, setTournaments] = useState([])
  const [activeTournament, setActiveTournamentState] = useState(null)
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

  /**
   * Set active tournament and apply its theme
   * @param {Object|null} tournament - Tournament object or null to clear
   */
  const setActiveTournament = useCallback(tournament => {
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

  /**
   * Apply tournament theme to document root
   * @param {string} slug - Tournament slug
   * @param {boolean} isDark - Whether to apply dark theme
   */
  const applyTheme = useCallback((slug, isDark) => {
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

/**
 * Hook to use Tournament context
 * @returns {Object} Tournament context value
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useTournament = () => {
  const context = useContext(TournamentContext)
  if (!context) {
    throw new Error('useTournament must be used within TournamentProvider')
  }
  return context
}
