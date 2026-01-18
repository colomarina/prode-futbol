import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const useMatches = (roundNumber = null) => {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchMatches()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundNumber])

  const fetchMatches = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('matches')
        .select(
          `
          *,
          home_team:teams!matches_home_team_id_fkey(id, name, slug, logo_url),
          away_team:teams!matches_away_team_id_fkey(id, name, slug, logo_url)
        `
        )
        .order('match_date', { ascending: true })

      if (roundNumber) {
        query = query.eq('round_number', roundNumber)
      }

      const { data, error } = await query

      if (error) throw error
      setMatches(data)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const createMatch = async matchData => {
    try {
      const { data, error } = await supabase.from('matches').insert([matchData]).select(`
          *,
          home_team:teams!matches_home_team_id_fkey(*),
          away_team:teams!matches_away_team_id_fkey(*)
        `)

      if (error) throw error
      await fetchMatches()
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
          away_team:teams!matches_away_team_id_fkey(*)
        `)

      if (error) throw error
      await fetchMatches()
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const deleteMatch = async matchId => {
    try {
      const { error } = await supabase.from('matches').delete().eq('id', matchId)

      if (error) throw error
      await fetchMatches()
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
