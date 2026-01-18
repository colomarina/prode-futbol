import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const useTeams = () => {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchTeams()
  }, [])

  const fetchTeams = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      setTeams(data)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const getTeamByName = name => teams.find(t => t.name === name)

  const getTeamById = id => teams.find(t => t.id === id)

  return {
    teams,
    loading,
    error,
    fetchTeams,
    getTeamByName,
    getTeamById,
  }
}
