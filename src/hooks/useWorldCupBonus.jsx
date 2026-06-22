import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export const useWorldCupBonus = tournamentId => {
  const { user } = useAuth()
  const [config, setConfig] = useState(null)
  const [teams, setTeams] = useState([])
  const [prediction, setPrediction] = useState(null)
  const [officialResults, setOfficialResults] = useState(null)
  const [bonusScore, setBonusScore] = useState(null)
  const [stats, setStats] = useState({ totalPredictions: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    if (!tournamentId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const requests = [
        supabase
          .from('world_cup_bonus_config')
          .select('*')
          .eq('tournament_id', tournamentId)
          .maybeSingle(),
        supabase
          .from('world_cup_teams')
          .select('team_id, teams:teams!world_cup_teams_team_id_fkey(id, name, slug, logo_url)')
          .eq('tournament_id', tournamentId)
          .order('created_at', { ascending: true }),
        supabase
          .from('world_cup_official_results')
          .select('*')
          .eq('tournament_id', tournamentId)
          .maybeSingle(),
      ]

      if (user?.id) {
        requests.push(
          supabase
            .from('world_cup_predictions')
            .select('*')
            .eq('tournament_id', tournamentId)
            .eq('user_id', user.id)
            .maybeSingle(),
          supabase
            .from('world_cup_bonus_scores')
            .select('*')
            .eq('tournament_id', tournamentId)
            .eq('user_id', user.id)
            .maybeSingle()
        )
      }

      const [configRes, teamsRes, officialRes, predictionRes, bonusRes] =
        await Promise.all(requests)

      if (configRes.error) throw configRes.error
      if (teamsRes.error) throw teamsRes.error
      if (officialRes.error) throw officialRes.error
      if (predictionRes?.error) throw predictionRes.error
      if (bonusRes?.error) throw bonusRes.error

      const mappedTeams = (teamsRes.data || [])
        .map(item => item.teams)
        .filter(Boolean)
        .sort((a, b) => a.name.localeCompare(b.name, 'es'))

      setConfig(configRes.data)
      setTeams(mappedTeams)
      setOfficialResults(officialRes.data)
      setPrediction(predictionRes?.data || null)
      setBonusScore(bonusRes?.data || null)

      // simple stat for admin screen
      const { count, error: countError } = await supabase
        .from('world_cup_predictions')
        .select('id', { count: 'exact', head: true })
        .eq('tournament_id', tournamentId)

      if (countError) throw countError
      setStats({ totalPredictions: count || 0 })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [tournamentId, user?.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const upsertPrediction = async values => {
    const { data, error: rpcError } = await supabase.rpc('upsert_world_cup_prediction', {
      p_tournament_id: tournamentId,
      p_champion_team_id: values.champion_team_id || null,
      p_runner_up_team_id: values.runner_up_team_id || null,
      p_third_place_team_id: values.third_place_team_id || null,
      p_top_scorer_text: values.top_scorer_text || null,
      p_best_player_text: values.best_player_text || null,
      p_best_goalkeeper_text: values.best_goalkeeper_text || null,
      p_least_goals_conceded_team_id: values.least_goals_conceded_team_id || null,
      p_revelation_team_id: values.revelation_team_id || null,
      p_most_assists_text: values.most_assists_text || null,
      p_most_cards_team_id: values.most_cards_team_id || null,
      p_will_there_be_hat_trick: values.will_there_be_hat_trick,
      p_argentina_stage: values.argentina_stage || null,
      p_final_goals: values.final_goals === '' ? null : values.final_goals,
      p_best_debutant_team_id: values.best_debutant_team_id || null,
    })

    if (rpcError) return { data: null, error: rpcError }
    setPrediction(data)
    return { data, error: null }
  }

  const adminSetLock = async ({ enabled, lockAt }) => {
    const { error: rpcError } = await supabase.rpc('admin_set_world_cup_lock', {
      p_tournament_id: tournamentId,
      p_enabled: enabled,
      p_lock_at: lockAt,
    })

    if (rpcError) return { error: rpcError }
    await fetchData()
    return { error: null }
  }

  const adminForceLock = async () => {
    const { error: rpcError } = await supabase.rpc('admin_lock_world_cup_predictions', {
      p_tournament_id: tournamentId,
    })

    if (rpcError) return { error: rpcError }
    await fetchData()
    return { error: null }
  }

  const adminUpsertOfficialResults = async values => {
    const { data, error: rpcError } = await supabase.rpc(
      'admin_upsert_world_cup_official_results',
      {
        p_tournament_id: tournamentId,
        p_champion_team_id: values.champion_team_id || null,
        p_runner_up_team_id: values.runner_up_team_id || null,
        p_third_place_team_id: values.third_place_team_id || null,
        p_top_scorer_text: values.top_scorer_text || null,
        p_best_player_text: values.best_player_text || null,
        p_best_goalkeeper_text: values.best_goalkeeper_text || null,
        p_least_goals_conceded_team_id: values.least_goals_conceded_team_id || null,
        p_revelation_team_id: values.revelation_team_id || null,
        p_most_assists_text: values.most_assists_text || null,
        p_most_cards_team_id: values.most_cards_team_id || null,
        p_will_there_be_hat_trick: values.will_there_be_hat_trick,
        p_argentina_stage: values.argentina_stage || null,
        p_final_goals: values.final_goals === '' ? null : values.final_goals,
        p_best_debutant_team_id: values.best_debutant_team_id || null,
      }
    )

    if (rpcError) return { data: null, error: rpcError }
    setOfficialResults(data)
    return { data, error: null }
  }

  const adminRecalculateBonus = async () => {
    const { error: rpcError } = await supabase.rpc('recalculate_world_cup_bonus', {
      p_tournament_id: tournamentId,
    })

    if (rpcError) return { error: rpcError }
    await fetchData()
    return { error: null }
  }

  return {
    config,
    teams,
    prediction,
    officialResults,
    bonusScore,
    stats,
    loading,
    error,
    fetchData,
    upsertPrediction,
    adminSetLock,
    adminForceLock,
    adminUpsertOfficialResults,
    adminRecalculateBonus,
  }
}
