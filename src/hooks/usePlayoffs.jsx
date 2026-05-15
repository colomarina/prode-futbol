import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const STAGES = ['32avos', '16avos', 'octavos', 'cuartos', 'semifinal', 'final']

const emptyMatchesByStage = {
  '32avos': [],
  '16avos': [],
  octavos: [],
  cuartos: [],
  semifinal: [],
  final: [],
}

export function usePlayoffs(tournamentId = null) {
  const [matchesByStage, setMatchesByStage] = useState(emptyMatchesByStage)
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuth()

  const fetchPlayoffMatches = useCallback(async () => {
    let query = supabase
      .from('matches')
      .select(
        `
        *,
        home_team:teams!matches_home_team_id_fkey(id, name, slug, logo_url),
        away_team:teams!matches_away_team_id_fkey(id, name, slug, logo_url),
        qualifier_team:teams!matches_qualifier_team_id_fkey(id, name, slug, logo_url)
      `
      )
      .eq('is_playoff', true)

    if (tournamentId) {
      query = query.eq('tournament_id', tournamentId)
    }

    const { data, error: matchesError } = await query
      .order('round_number', { ascending: true })
      .order('match_number', { ascending: true })
      .order('match_date', { ascending: true })

    if (matchesError) throw matchesError

    const grouped = {
      '32avos': [],
      '16avos': [],
      octavos: [],
      cuartos: [],
      semifinal: [],
      final: [],
    }

    ;(data || []).forEach(match => {
      const stage = STAGES.includes(match.playoff_stage) ? match.playoff_stage : null
      if (!stage) return
      grouped[stage].push(match)
    })

    setMatchesByStage(grouped)

    return data || []
  }, [tournamentId])

  const fetchPredictions = useCallback(
    async playoffMatches => {
      if (!user?.id || !playoffMatches.length) {
        setPredictions([])
        return
      }

      const { data, error: predictionsError } = await supabase
        .from('predictions')
        .select('match_id, home_prediction, away_prediction, points, qualifier_prediction_id')
        .eq('user_id', user.id)
        .in(
          'match_id',
          playoffMatches.map(match => match.id)
        )

      if (predictionsError) throw predictionsError
      setPredictions(data || [])
    },
    [user?.id]
  )

  const fetchPlayoffs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const playoffMatches = await fetchPlayoffMatches()
      await fetchPredictions(playoffMatches)
    } catch (fetchError) {
      setError(fetchError.message)
    } finally {
      setLoading(false)
    }
  }, [fetchPlayoffMatches, fetchPredictions])

  useEffect(() => {
    fetchPlayoffs()
  }, [fetchPlayoffs])

  const hasAnyPlayoffMatches = useMemo(
    () => Object.values(matchesByStage).some(matches => matches.length > 0),
    [matchesByStage]
  )

  return {
    matchesByStage,
    predictions,
    loading,
    error,
    hasAnyPlayoffMatches,
    fetchPlayoffs,
  }
}
