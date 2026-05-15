import { useState, useEffect, useLayoutEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export const useMatches = (roundNumber = null, tournamentId = null) => {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Marcar como loading inmediatamente (antes del paint) cuando cambia roundNumber,
  // para evitar el flash de EmptyState entre el cambio de ronda y el arranque del fetch.
  useLayoutEffect(() => {
    if (roundNumber) {
      setLoading(true)
    }
  }, [roundNumber])

  const fetchMatches = useCallback(async () => {
    // Si no hay roundNumber, no traer nada
    if (!roundNumber) {
      setMatches([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      let query = supabase.from('matches').select(
        `
          *,
          home_team:teams!matches_home_team_id_fkey(id, name, slug, logo_url),
          away_team:teams!matches_away_team_id_fkey(id, name, slug, logo_url),
          qualifier_team:teams!matches_qualifier_team_id_fkey(id, name, slug, logo_url)
        `
      )

      query = query.eq('round_number', roundNumber)

      if (tournamentId) {
        query = query.eq('tournament_id', tournamentId)
      }

      const { data, error } = await query
        .order('match_number', { ascending: true })
        .order('match_date', { ascending: true })

      if (error) throw error
      setMatches(data || [])
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }, [roundNumber, tournamentId])

  useEffect(() => {
    fetchMatches()
  }, [fetchMatches])

  const createMatch = async matchData => {
    try {
      const { data, error } = await supabase.from('matches').insert([matchData]).select(`
          *,
          home_team:teams!matches_home_team_id_fkey(*),
          away_team:teams!matches_away_team_id_fkey(*),
          qualifier_team:teams!matches_qualifier_team_id_fkey(*)
        `)

      if (error) throw error
      if (data && data.length > 0) {
        setMatches(prev =>
          [...prev, ...data].sort((a, b) => {
            if (a.match_number !== b.match_number) return a.match_number - b.match_number
            return new Date(a.match_date) - new Date(b.match_date)
          })
        )
      }
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const updateMatch = async (matchId, updates) => {
    try {
      const { data, error } = await supabase.from('matches').update(updates).eq('id', matchId)
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(*),
          away_team:teams!matches_away_team_id_fkey(*),
          qualifier_team:teams!matches_qualifier_team_id_fkey(*)
        `)

      if (error) throw error
      if (data && data.length > 0) {
        setMatches(prev => prev.map(match => (match.id === matchId ? data[0] : match)))
      }
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const deleteMatch = async matchId => {
    try {
      const { error } = await supabase.from('matches').delete().eq('id', matchId)

      if (error) throw error
      setMatches(prev => prev.filter(match => match.id !== matchId))
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  return {
    matches,
    loading,
    error,
    fetchMatches,
    createMatch,
    updateMatch,
    deleteMatch,
  }
}
