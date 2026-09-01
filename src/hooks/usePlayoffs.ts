import { useCallback, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/queryKeys'
import { useAuth } from '../contexts/AuthContext'
import type { MatchWithTeams, PlayoffStage, Prediction, Uuid } from '../types/domain'

/**
 * Las seis rondas de playoff. Es el mismo conjunto que el CHECK de
 * `matches.playoff_stage`, y el tipo lo garantiza: si la unión de `domain.ts` cambia,
 * este array deja de compilar.
 */
const STAGES: PlayoffStage[] = ['32avos', '16avos', 'octavos', 'cuartos', 'semifinal', 'final']

/**
 * `matches.playoff_stage` es `string | null` en el esquema —es un CHECK, no un enum—,
 * así que hace falta estrechar. El único cast de la cadena vive acá, en un predicado
 * con nombre, en vez de repetirse en cada uso.
 */
const isPlayoffStage = (value: string | null): value is PlayoffStage =>
  value !== null && (STAGES as string[]).includes(value)

/** El bracket: los partidos de cada ronda, siempre con las seis claves presentes. */
export type MatchesByStage = Record<PlayoffStage, MatchWithTeams[]>

/**
 * Un objeto **nuevo** en cada llamada, y eso es lo importante: si los arrays se
 * compartieran entre llamadas, el `push` de abajo acumularía los partidos de todas.
 * Antes esto era una constante de módulo más un segundo spread que la sobrescribía
 * con arrays frescos; el segundo spread parecía redundante y era lo único que
 * evitaba el bug.
 */
const emptyMatchesByStage = (): MatchesByStage => ({
  '32avos': [],
  '16avos': [],
  octavos: [],
  cuartos: [],
  semifinal: [],
  final: [],
})

const groupByStage = (matches: MatchWithTeams[] | null | undefined): MatchesByStage => {
  const grouped = emptyMatchesByStage()

  ;(matches || []).forEach(match => {
    const stage = match.playoff_stage
    if (!isPlayoffStage(stage)) return
    grouped[stage].push(match)
  })

  return grouped
}

/** Del pronóstico de un playoff se lee el marcador, los puntos y el clasificado. */
export type PlayoffPrediction = Pick<
  Prediction,
  'match_id' | 'home_prediction' | 'away_prediction' | 'points' | 'qualifier_prediction_id'
>

/**
 * Bracket de playoffs y los pronósticos del usuario para esos partidos.
 *
 * Los pronósticos siguen dependiendo de los partidos (necesitan sus ids), así
 * que el encadenamiento acá es real y se modela con `enabled`, no con un await
 * dentro del mismo fetch.
 */
export function usePlayoffs(tournamentId: Uuid | null = null) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const matchesQuery = useQuery({
    queryKey: queryKeys.playoffMatches(tournamentId),
    queryFn: async (): Promise<MatchWithTeams[]> => {
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
    queryFn: async (): Promise<PlayoffPrediction[]> => {
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
