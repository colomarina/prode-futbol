import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { applyTournamentTheme } from '../config/tournaments.config'

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
            applyTheme(tournament.slug, isDark)
          }
        }
      } catch (err) {
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
  const setActiveTournament = tournament => {
    if (!tournament) {
      setActiveTournamentState(null)
      localStorage.removeItem('active_tournament_slug')
      return
    }

    setActiveTournamentState(tournament)
    localStorage.setItem('active_tournament_slug', tournament.slug)

    // Apply theme based on current data-theme
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
    applyTheme(tournament.slug, isDark)
  }

  /**
   * Apply tournament theme to document root
   * @param {string} slug - Tournament slug
   * @param {boolean} isDark - Whether to apply dark theme
   */
  const applyTheme = (slug, isDark) => {
    applyTournamentTheme(slug, isDark)
  }

  const value = {
    tournaments,
    activeTournament,
    setActiveTournament,
    applyTheme,
    loading,
  }

  return <TournamentContext.Provider value={value}>{children}</TournamentContext.Provider>
}

/**
 * Hook to use Tournament context
 * @returns {Object} Tournament context value
 */
export const useTournament = () => {
  const context = useContext(TournamentContext)
  if (!context) {
    throw new Error('useTournament must be used within TournamentProvider')
  }
  return context
}
