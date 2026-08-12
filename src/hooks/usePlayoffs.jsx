import { useCallback, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/queryKeys'
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

const groupByStage = matches => {
  const grouped = { ...emptyMatchesByStage, ...Object.fromEntries(STAGES.map(s => [s, []])) }

  ;(matches || []).forEach(match => {
    if (!STAGES.includes(match.playoff_stage)) return
    grouped[match.playoff_stage].push(match)
  })

  return grouped
}

/**
 * Bracket de playoffs y los pronósticos del usuario para esos partidos.
 *
 * Los pronósticos siguen dependiendo de los partidos (necesitan sus ids), así
 * que el encadenamiento acá es real y se modela con `enabled`, no con un await
 * dentro del mismo fetch.
 *
 * @param {string|null} tournamentId
 */
export function usePlayoffs(tournamentId = null) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const matchesQuery = useQuery({
    queryKey: queryKeys.playoffMatches(tournamentId),
    queryFn: async () => {
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

      const { data, error } = await query
        .order('round_number', { ascending: true })
        .order('match_number', { ascending: true })
        .order('match_date', { ascending: true })

      if (error) throw error
      return data || []
    },
  })

  const playoffMatchIds = useMemo(
    () => (matchesQuery.data || []).map(match => match.id),
    [matchesQuery.data]
  )

  const predictionsQuery = useQuery({
    queryKey: queryKeys.playoffPredictions(tournamentId, user?.id),
    enabled: Boolean(user?.id) && playoffMatchIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('predictions')
        .select('match_id, home_prediction, away_prediction, points, qualifier_prediction_id')
        .eq('user_id', user.id)
        .in('match_id', playoffMatchIds)

      if (error) throw error
      return data || []
    },
  })

  const matchesByStage = useMemo(() => groupByStage(matchesQuery.data), [matchesQuery.data])

  // Referencia estable: sin partidos de playoff la query de pronósticos queda
  // deshabilitada, y un `?? []` a secas devolvería un array nuevo por render.
  const predictions = useMemo(() => predictionsQuery.data ?? [], [predictionsQuery.data])

  const hasAnyPlayoffMatches = useMemo(
    () => Object.values(matchesByStage).some(matches => matches.length > 0),
    [matchesByStage]
  )

  const fetchPlayoffs = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.playoffMatches(tournamentId) })
    queryClient.invalidateQueries({
      queryKey: queryKeys.playoffPredictions(tournamentId, user?.id),
    })
  }, [queryClient, tournamentId, user?.id])

  // Los pronosticos solo cuentan como "cargando" si de verdad se van a pedir:
  // sin partidos de playoff o sin usuario, su query queda deshabilitada.
  const predictionsPending =
    predictionsQuery.isPending && Boolean(user?.id) && playoffMatchIds.length > 0

  return {
    matchesByStage,
    predictions,
    loading: matchesQuery.isPending || predictionsPending,
    error: matchesQuery.error?.message || predictionsQuery.error?.message || null,
    hasAnyPlayoffMatches,
    fetchPlayoffs,
  }
}
