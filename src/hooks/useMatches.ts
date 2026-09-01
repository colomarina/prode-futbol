import { useCallback, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/queryKeys'
import type { MatchWithTeams, TablesInsert, TablesUpdate, Uuid } from '../types/domain'
import type { MutationResult, MutationResultWithData } from './types'

const MATCH_WITH_TEAMS = `
  *,
  home_team:teams!matches_home_team_id_fkey(id, name, slug, logo_url),
  away_team:teams!matches_away_team_id_fkey(id, name, slug, logo_url),
  qualifier_team:teams!matches_qualifier_team_id_fkey(id, name, slug, logo_url)
`

/**
 * Partidos de una fecha, con los equipos embebidos.
 *
 * Antes había un `useLayoutEffect` que forzaba `loading` al cambiar de fecha
 * para tapar un flash de EmptyState. Ya no hace falta: al cambiar la query key
 * React Query no sirve los datos de la fecha anterior, así que no hay un
 * intervalo en el que el estado diga "listo" con los datos viejos.
 */
export const useMatches = (roundNumber: number | null = null, tournamentId: Uuid | null = null) => {
  const queryClient = useQueryClient()

  const { data, isPending, error, refetch } = useQuery({
    queryKey: queryKeys.matchesByRound(tournamentId, roundNumber),
    enabled: Boolean(roundNumber),
    queryFn: async (): Promise<MatchWithTeams[]> => {
      let query = supabase.from('matches').select(MATCH_WITH_TEAMS).eq('round_number', roundNumber)

      if (tournamentId) {
        query = query.eq('tournament_id', tournamentId)
      }

      const { data: matches, error: matchesError } = await query
        .order('match_number', { ascending: true })
        .order('match_date', { ascending: true })

      if (matchesError) throw matchesError
      return matches || []
    },
  })

  /**
   * Cualquier escritura sobre partidos invalida tambien matchesMeta: de ahi
   * salen la fecha activa y que fechas admiten carga de resultados.
   */
  const invalidateMatches = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.matchesByRound(tournamentId, roundNumber) })
    queryClient.invalidateQueries({ queryKey: queryKeys.matchesMeta(tournamentId) })
  }, [queryClient, tournamentId, roundNumber])

  const createMutation = useMutation({
    mutationFn: async (matchData: TablesInsert<'matches'>) => {
      const { data: created, error: createError } = await supabase
        .from('matches')
        .insert([matchData])
        .select(MATCH_WITH_TEAMS)

      if (createError) throw createError
      return created
    },
    onSuccess: invalidateMatches,
  })

  const updateMutation = useMutation({
    mutationFn: async ({
      matchId,
      updates,
    }: {
      matchId: Uuid
      updates: TablesUpdate<'matches'>
    }) => {
      const { data: updated, error: updateError } = await supabase
        .from('matches')
        .update(updates)
        .eq('id', matchId)
        .select(MATCH_WITH_TEAMS)

      if (updateError) throw updateError
      return updated
    },
    onSuccess: invalidateMatches,
  })

  const deleteMutation = useMutation({
    mutationFn: async (matchId: Uuid): Promise<void> => {
      const { error: deleteError } = await supabase.from('matches').delete().eq('id', matchId)
      if (deleteError) throw deleteError
    },
    onSuccess: invalidateMatches,
  })

  // Se conserva el contrato { data, error } que ya usan los componentes.
  const createMatch = useCallback(
    async (
      matchData: TablesInsert<'matches'>
    ): Promise<MutationResultWithData<MatchWithTeams[]>> => {
      try {
        const created = await createMutation.mutateAsync(matchData)
        return { data: created, error: null }
      } catch (error) {
        return { data: null, error }
      }
    },
    [createMutation]
  )

  const updateMatch = useCallback(
    async (
      matchId: Uuid,
      updates: TablesUpdate<'matches'>
    ): Promise<MutationResultWithData<MatchWithTeams[]>> => {
      try {
        const updated = await updateMutation.mutateAsync({ matchId, updates })
        return { data: updated, error: null }
      } catch (error) {
        return { data: null, error }
      }
    },
    [updateMutation]
  )

  const deleteMatch = useCallback(
    async (matchId: Uuid): Promise<MutationResult> => {
      try {
        await deleteMutation.mutateAsync(matchId)
        return { error: null }
      } catch (error) {
        return { error }
      }
    },
    [deleteMutation]
  )

  // useMemo y no `data ?? []` a secas: el array literal seria una referencia
  // nueva en cada render, y `AdminMatchSchedule` tiene un efecto con dependencia
  // `[matches]` que setea estado. Eso entraba en bucle hasta que React cortaba.
  const matches = useMemo(() => data ?? [], [data])

  return {
    matches,
    // Sin roundNumber la query queda deshabilitada y React Query la reporta como
    // pendiente para siempre; para el consumidor eso no es "cargando".
    loading: Boolean(roundNumber) && isPending,
    error: error ? error.message : null,
    fetchMatches: refetch,
    createMatch,
    updateMatch,
    deleteMatch,
  }
}
