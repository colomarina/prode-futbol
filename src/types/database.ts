export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      matches: {
        Row: {
          away_score: number | null
          away_team_id: string
          created_at: string | null
          group_label: string | null
          home_score: number | null
          home_team_id: string
          id: string
          is_finished: boolean | null
          is_playoff: boolean
          match_date: string
          match_number: number
          playoff_stage: string | null
          qualifier_team_id: string | null
          round_number: number
          status: string | null
          tournament_id: string | null
        }
        Insert: {
          away_score?: number | null
          away_team_id: string
          created_at?: string | null
          group_label?: string | null
          home_score?: number | null
          home_team_id: string
          id?: string
          is_finished?: boolean | null
          is_playoff?: boolean
          match_date: string
          match_number: number
          playoff_stage?: string | null
          qualifier_team_id?: string | null
          round_number: number
          status?: string | null
          tournament_id?: string | null
        }
        Update: {
          away_score?: number | null
          away_team_id?: string
          created_at?: string | null
          group_label?: string | null
          home_score?: number | null
          home_team_id?: string
          id?: string
          is_finished?: boolean | null
          is_playoff?: boolean
          match_date?: string
          match_number?: number
          playoff_stage?: string | null
          qualifier_team_id?: string | null
          round_number?: number
          status?: string | null
          tournament_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_qualifier_team_id_fkey"
            columns: ["qualifier_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_allocations: {
        Row: {
          allocated_amount: number
          created_at: string
          id: string
          payment_id: string
          round_number: number
          tournament_id: string
          user_id: string
        }
        Insert: {
          allocated_amount: number
          created_at?: string
          id?: string
          payment_id: string
          round_number: number
          tournament_id: string
          user_id: string
        }
        Update: {
          allocated_amount?: number
          created_at?: string
          id?: string
          payment_id?: string
          round_number?: number
          tournament_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_allocations_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_allocations_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_allocations_tournament_round_fkey"
            columns: ["tournament_id", "round_number"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["tournament_id", "round_number"]
          },
        ]
      }
      payments: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          payment_date: string
          payment_method: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      predictions: {
        Row: {
          away_prediction: number
          created_at: string | null
          home_prediction: number
          id: string
          match_id: string
          points: number | null
          qualifier_prediction_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          away_prediction: number
          created_at?: string | null
          home_prediction: number
          id?: string
          match_id: string
          points?: number | null
          qualifier_prediction_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          away_prediction?: number
          created_at?: string | null
          home_prediction?: number
          id?: string
          match_id?: string
          points?: number | null
          qualifier_prediction_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "predictions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_qualifier_prediction_id_fkey"
            columns: ["qualifier_prediction_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          role: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          role?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          username?: string
        }
        Relationships: []
      }
      round_finances: {
        Row: {
          created_at: string
          entry_fee_amount: number
          notes: string | null
          prize_amount: number
          round_number: number
          tournament_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          entry_fee_amount?: number
          notes?: string | null
          prize_amount?: number
          round_number: number
          tournament_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          entry_fee_amount?: number
          notes?: string | null
          prize_amount?: number
          round_number?: number
          tournament_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "round_finances_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "round_finances_tournament_round_fkey"
            columns: ["tournament_id", "round_number"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["tournament_id", "round_number"]
          },
        ]
      }
      round_payments: {
        Row: {
          created_at: string
          has_paid: boolean
          paid_at: string | null
          round_number: number
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          has_paid?: boolean
          paid_at?: string | null
          round_number: number
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          has_paid?: boolean
          paid_at?: string | null
          round_number?: number
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "round_payments_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "general_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "round_payments_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "general_leaderboard_by_tournament"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "round_payments_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "round_payments_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "round_payments_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "round_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "round_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "general_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "round_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "general_leaderboard_by_tournament"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "round_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "round_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "round_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "round_leaderboard"
            referencedColumns: ["id"]
          },
        ]
      }
      round_scores: {
        Row: {
          id: string
          round_number: number
          total_points: number | null
          tournament_id: string
          user_id: string
        }
        Insert: {
          id?: string
          round_number: number
          total_points?: number | null
          tournament_id: string
          user_id: string
        }
        Update: {
          id?: string
          round_number?: number
          total_points?: number | null
          tournament_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "round_scores_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "round_scores_tournament_round_fkey"
            columns: ["tournament_id", "round_number"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["tournament_id", "round_number"]
          },
          {
            foreignKeyName: "round_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "general_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "round_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "general_leaderboard_by_tournament"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "round_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "round_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "round_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "round_leaderboard"
            referencedColumns: ["id"]
          },
        ]
      }
      rounds: {
        Row: {
          closes_at: string | null
          created_at: string | null
          id: string
          name: string | null
          opens_at: string | null
          round_number: number
          status: string | null
          tournament_id: string | null
          updated_at: string | null
        }
        Insert: {
          closes_at?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          opens_at?: string | null
          round_number: number
          status?: string | null
          tournament_id?: string | null
          updated_at?: string | null
        }
        Update: {
          closes_at?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          opens_at?: string | null
          round_number?: number
          status?: string | null
          tournament_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rounds_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string | null
          id: string
          logo_url: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          logo_url: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          logo_url?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      tournaments: {
        Row: {
          created_at: string | null
          id: string
          name: string
          season: string | null
          slug: string
          status: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          season?: string | null
          slug: string
          status?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          season?: string | null
          slug?: string
          status?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      world_cup_bonus_config: {
        Row: {
          created_at: string
          enabled: boolean
          is_locked: boolean
          lock_at: string | null
          locked_at: string | null
          locked_by: string | null
          tournament_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          is_locked?: boolean
          lock_at?: string | null
          locked_at?: string | null
          locked_by?: string | null
          tournament_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          is_locked?: boolean
          lock_at?: string | null
          locked_at?: string | null
          locked_by?: string | null
          tournament_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "world_cup_bonus_config_locked_by_fkey"
            columns: ["locked_by"]
            isOneToOne: false
            referencedRelation: "general_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_cup_bonus_config_locked_by_fkey"
            columns: ["locked_by"]
            isOneToOne: false
            referencedRelation: "general_leaderboard_by_tournament"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_cup_bonus_config_locked_by_fkey"
            columns: ["locked_by"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_cup_bonus_config_locked_by_fkey"
            columns: ["locked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_cup_bonus_config_locked_by_fkey"
            columns: ["locked_by"]
            isOneToOne: false
            referencedRelation: "round_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_cup_bonus_config_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: true
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      world_cup_bonus_scores: {
        Row: {
          breakdown: Json
          calculated_at: string
          total_points: number
          tournament_id: string
          user_id: string
        }
        Insert: {
          breakdown?: Json
          calculated_at?: string
          total_points?: number
          tournament_id: string
          user_id: string
        }
        Update: {
          breakdown?: Json
          calculated_at?: string
          total_points?: number
          tournament_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "world_cup_bonus_scores_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_cup_bonus_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "general_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_cup_bonus_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "general_leaderboard_by_tournament"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_cup_bonus_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_cup_bonus_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_cup_bonus_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "round_leaderboard"
            referencedColumns: ["id"]
          },
        ]
      }
      world_cup_official_results: {
        Row: {
          argentina_stage: string | null
          best_debutant_team_id: string | null
          best_goalkeeper_text: string | null
          best_player_text: string | null
          champion_team_id: string | null
          created_at: string
          final_goals: number | null
          least_goals_conceded_team_id: string | null
          most_assists_text: string | null
          most_cards_team_id: string | null
          published_at: string | null
          published_by: string | null
          revelation_team_id: string | null
          runner_up_team_id: string | null
          third_place_team_id: string | null
          top_scorer_text: string | null
          tournament_id: string
          updated_at: string
          will_there_be_hat_trick: boolean | null
        }
        Insert: {
          argentina_stage?: string | null
          best_debutant_team_id?: string | null
          best_goalkeeper_text?: string | null
          best_player_text?: string | null
          champion_team_id?: string | null
          created_at?: string
          final_goals?: number | null
          least_goals_conceded_team_id?: string | null
          most_assists_text?: string | null
          most_cards_team_id?: string | null
          published_at?: string | null
          published_by?: string | null
          revelation_team_id?: string | null
          runner_up_team_id?: string | null
          third_place_team_id?: string | null
          top_scorer_text?: string | null
          tournament_id: string
          updated_at?: string
          will_there_be_hat_trick?: boolean | null
        }
        Update: {
          argentina_stage?: string | null
          best_debutant_team_id?: string | null
          best_goalkeeper_text?: string | null
          best_player_text?: string | null
          champion_team_id?: string | null
          created_at?: string
          final_goals?: number | null
          least_goals_conceded_team_id?: string | null
          most_assists_text?: string | null
          most_cards_team_id?: string | null
          published_at?: string | null
          published_by?: string | null
          revelation_team_id?: string | null
          runner_up_team_id?: string | null
          third_place_team_id?: string | null
          top_scorer_text?: string | null
          tournament_id?: string
          updated_at?: string
          will_there_be_hat_trick?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "world_cup_official_results_best_debutant_team_id_fkey"
            columns: ["best_debutant_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_cup_official_results_champion_team_id_fkey"
            columns: ["champion_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_cup_official_results_least_goals_conceded_team_id_fkey"
            columns: ["least_goals_conceded_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_cup_official_results_most_cards_team_id_fkey"
            columns: ["most_cards_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_cup_official_results_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "general_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_cup_official_results_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "general_leaderboard_by_tournament"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_cup_official_results_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_cup_official_results_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_cup_official_results_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "round_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_cup_official_results_revelation_team_id_fkey"
            columns: ["revelation_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_cup_official_results_runner_up_team_id_fkey"
            columns: ["runner_up_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_cup_official_results_third_place_team_id_fkey"
            columns: ["third_place_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_cup_official_results_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: true
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      world_cup_predictions: {
        Row: {
          argentina_stage: string | null
          best_debutant_team_id: string | null
          best_goalkeeper_text: string | null
          best_player_text: string | null
          champion_team_id: string | null
          created_at: string
          final_goals: number | null
          id: string
          least_goals_conceded_team_id: string | null
          most_assists_text: string | null
          most_cards_team_id: string | null
          revelation_team_id: string | null
          runner_up_team_id: string | null
          third_place_team_id: string | null
          top_scorer_text: string | null
          tournament_id: string
          updated_at: string
          user_id: string
          will_there_be_hat_trick: boolean | null
        }
        Insert: {
          argentina_stage?: string | null
          best_debutant_team_id?: string | null
          best_goalkeeper_text?: string | null
          best_player_text?: string | null
          champion_team_id?: string | null
          created_at?: string
          final_goals?: number | null
          id?: string
          least_goals_conceded_team_id?: string | null
          most_assists_text?: string | null
          most_cards_team_id?: string | null
          revelation_team_id?: string | null
          runner_up_team_id?: string | null
          third_place_team_id?: string | null
          top_scorer_text?: string | null
          tournament_id: string
          updated_at?: string
          user_id: string
          will_there_be_hat_trick?: boolean | null
        }
        Update: {
          argentina_stage?: string | null
          best_debutant_team_id?: string | null
          best_goalkeeper_text?: string | null
          best_player_text?: string | null
          champion_team_id?: string | null
          created_at?: string
          final_goals?: number | null
          id?: string
          least_goals_conceded_team_id?: string | null
          most_assists_text?: string | null
          most_cards_team_id?: string | null
          revelation_team_id?: string | null
          runner_up_team_id?: string | null
          third_place_team_id?: string | null
          top_scorer_text?: string | null
          tournament_id?: string
          updated_at?: string
          user_id?: string
          will_there_be_hat_trick?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "world_cup_predictions_best_debutant_team_id_fkey"
            columns: ["best_debutant_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_cup_predictions_champion_team_id_fkey"
            columns: ["champion_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_cup_predictions_least_goals_conceded_team_id_fkey"
            columns: ["least_goals_conceded_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_cup_predictions_most_cards_team_id_fkey"
            columns: ["most_cards_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_cup_predictions_revelation_team_id_fkey"
            columns: ["revelation_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_cup_predictions_runner_up_team_id_fkey"
            columns: ["runner_up_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_cup_predictions_third_place_team_id_fkey"
            columns: ["third_place_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_cup_predictions_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_cup_predictions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "general_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_cup_predictions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "general_leaderboard_by_tournament"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_cup_predictions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_cup_predictions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_cup_predictions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "round_leaderboard"
            referencedColumns: ["id"]
          },
        ]
      }
      world_cup_teams: {
        Row: {
          created_at: string
          id: string
          team_id: string
          tournament_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          team_id: string
          tournament_id: string
        }
        Update: {
          created_at?: string
          id?: string
          team_id?: string
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "world_cup_teams_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_cup_teams_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      general_leaderboard: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string | null
          rounds_played: number | null
          total_points: number | null
          username: string | null
        }
        Relationships: []
      }
      general_leaderboard_by_tournament: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string | null
          rounds_played: number | null
          total_points: number | null
          tournament_id: string | null
          username: string | null
        }
        Relationships: [
          {
            foreignKeyName: "round_scores_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard: {
        Row: {
          full_name: string | null
          id: string | null
          rounds_played: number | null
          total_points: number | null
          username: string | null
        }
        Relationships: []
      }
      round_leaderboard: {
        Row: {
          full_name: string | null
          id: string | null
          round_number: number | null
          total_points: number | null
          username: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _round_collides_with_other_tournament: {
        Args: { p_round_number: number; p_tournament_id: string }
        Returns: boolean
      }
      admin_lock_world_cup_predictions: {
        Args: { p_tournament_id: string }
        Returns: undefined
      }
      admin_set_world_cup_lock: {
        Args: { p_enabled: boolean; p_lock_at: string; p_tournament_id: string }
        Returns: undefined
      }
      admin_upsert_world_cup_official_results: {
        Args: {
          p_argentina_stage: string
          p_best_debutant_team_id: string
          p_best_goalkeeper_text: string
          p_best_player_text: string
          p_champion_team_id: string
          p_final_goals: number
          p_least_goals_conceded_team_id: string
          p_most_assists_text: string
          p_most_cards_team_id: string
          p_revelation_team_id: string
          p_runner_up_team_id: string
          p_third_place_team_id: string
          p_top_scorer_text: string
          p_tournament_id: string
          p_will_there_be_hat_trick: boolean
        }
        Returns: {
          argentina_stage: string | null
          best_debutant_team_id: string | null
          best_goalkeeper_text: string | null
          best_player_text: string | null
          champion_team_id: string | null
          created_at: string
          final_goals: number | null
          least_goals_conceded_team_id: string | null
          most_assists_text: string | null
          most_cards_team_id: string | null
          published_at: string | null
          published_by: string | null
          revelation_team_id: string | null
          runner_up_team_id: string | null
          third_place_team_id: string | null
          top_scorer_text: string | null
          tournament_id: string
          updated_at: string
          will_there_be_hat_trick: boolean | null
        }
        SetofOptions: {
          from: "*"
          to: "world_cup_official_results"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      calculate_points: {
        Args: {
          away_pred: number
          away_real: number
          home_pred: number
          home_real: number
        }
        Returns: number
      }
      can_predict: { Args: { match_id: string }; Returns: boolean }
      get_all_round_financial_summaries: {
        Args: never
        Returns: {
          collected_amount: number
          difference_amount: number
          entry_fee_amount: number
          paid_users: number
          pending_users: number
          prize_amount: number
          round_number: number
          round_status: string
          running_balance: number
        }[]
      }
      get_all_round_financial_summaries_by_tournament: {
        Args: { p_tournament_id: string }
        Returns: {
          collected_amount: number
          difference_amount: number
          entry_fee_amount: number
          paid_users: number
          pending_users: number
          prize_amount: number
          round_number: number
          round_status: string
          running_balance: number
        }[]
      }
      get_my_round_payment_status: {
        Args: { p_round_number: number }
        Returns: boolean
      }
      get_my_round_payment_status_by_tournament: {
        Args: { p_round_number: number; p_tournament_id: string }
        Returns: boolean
      }
      get_personal_stats: { Args: never; Returns: Json }
      get_personal_stats_by_tournament: {
        Args: { p_tournament_id: string }
        Returns: Json
      }
      get_round_financial_summary: {
        Args: { p_round_number: number }
        Returns: {
          collected_amount: number
          difference_amount: number
          entry_fee_amount: number
          paid_users: number
          pending_users: number
          prize_amount: number
          round_number: number
          round_status: string
        }[]
      }
      get_round_payments_status: {
        Args: { p_round_number: number }
        Returns: {
          full_name: string
          has_paid: boolean
          paid_at: string
          user_id: string
          username: string
        }[]
      }
      get_round_payments_status_by_tournament: {
        Args: { p_round_number: number; p_tournament_id: string }
        Returns: {
          full_name: string
          has_paid: boolean
          paid_at: string
          user_id: string
          username: string
        }[]
      }
      get_round_predictions_summary:
        | {
            Args: never
            Returns: {
              missing_matches: number[]
              predicted_count: number
              progress: number
              round_number: number
              total_matches: number
              user_id: string
              user_name: string
            }[]
          }
        | {
            Args: { round_num: number }
            Returns: {
              missing_matches: number[]
              predicted_count: number
              progress: number
              total_matches: number
              user_id: string
              user_name: string
            }[]
          }
      get_round_predictions_summary_by_tournament: {
        Args: { p_round_num?: number; p_tournament_id: string }
        Returns: {
          missing_matches: number[]
          predicted_count: number
          progress: number
          round_number: number
          total_matches: number
          user_id: string
          user_name: string
        }[]
      }
      get_round_predictions_summary_by_tournament_v2: {
        Args: { p_round_num: number; p_tournament_id: string }
        Returns: {
          missing_matches: number[]
          predicted_count: number
          progress: number
          round_number: number
          total_matches: number
          user_id: string
          user_name: string
        }[]
      }
      get_tournament_leaderboard_with_bonus: {
        Args: { p_tournament_id: string }
        Returns: {
          avatar_url: string
          bonus_points: number
          full_name: string
          id: string
          rounds_played: number
          total_points: number
          username: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      normalize_prediction_text: { Args: { p_text: string }; Returns: string }
      recalculate_round: { Args: { round_num: number }; Returns: Json }
      recalculate_round_scores: {
        Args: { p_round_number: number }
        Returns: undefined
      }
      recalculate_world_cup_bonus: {
        Args: { p_tournament_id: string }
        Returns: undefined
      }
      register_payment: {
        Args: {
          p_allocations?: Json
          p_notes?: string
          p_payment_date?: string
          p_payment_method?: string
          p_total_amount: number
          p_user_id: string
        }
        Returns: string
      }
      register_payment_by_tournament: {
        Args: {
          p_allocations: Json
          p_payment_method: string
          p_total_amount: number
          p_tournament_id: string
          p_user_id: string
        }
        Returns: undefined
      }
      remove_round_allocation: {
        Args: { p_round_number: number; p_user_id: string }
        Returns: undefined
      }
      remove_round_allocation_by_tournament: {
        Args: {
          p_round_number: number
          p_tournament_id: string
          p_user_id: string
        }
        Returns: undefined
      }
      reset_round: { Args: { round_num: number }; Returns: Json }
      set_round_payment_status: {
        Args: { p_has_paid: boolean; p_round_number: number; p_user_id: string }
        Returns: undefined
      }
      sync_one_round_payment_to_finance: {
        Args: {
          p_has_paid: boolean
          p_paid_at: string
          p_round_number: number
          p_user_id: string
        }
        Returns: undefined
      }
      upsert_round_finance: {
        Args: {
          p_entry_fee: number
          p_notes?: string
          p_prize_amount: number
          p_round_number: number
        }
        Returns: undefined
      }
      upsert_round_finance_by_tournament: {
        Args: {
          p_entry_fee: number
          p_prize_amount: number
          p_round_number: number
          p_tournament_id: string
        }
        Returns: undefined
      }
      upsert_world_cup_prediction: {
        Args: {
          p_argentina_stage: string
          p_best_debutant_team_id: string
          p_best_goalkeeper_text: string
          p_best_player_text: string
          p_champion_team_id: string
          p_final_goals: number
          p_least_goals_conceded_team_id: string
          p_most_assists_text: string
          p_most_cards_team_id: string
          p_revelation_team_id: string
          p_runner_up_team_id: string
          p_third_place_team_id: string
          p_top_scorer_text: string
          p_tournament_id: string
          p_will_there_be_hat_trick: boolean
        }
        Returns: {
          argentina_stage: string | null
          best_debutant_team_id: string | null
          best_goalkeeper_text: string | null
          best_player_text: string | null
          champion_team_id: string | null
          created_at: string
          final_goals: number | null
          id: string
          least_goals_conceded_team_id: string | null
          most_assists_text: string | null
          most_cards_team_id: string | null
          revelation_team_id: string | null
          runner_up_team_id: string | null
          third_place_team_id: string | null
          top_scorer_text: string | null
          tournament_id: string
          updated_at: string
          user_id: string
          will_there_be_hat_trick: boolean | null
        }
        SetofOptions: {
          from: "*"
          to: "world_cup_predictions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      world_cup_is_locked: {
        Args: { p_tournament_id: string }
        Returns: boolean
      }
      world_cup_team_is_allowed: {
        Args: { p_team_id: string; p_tournament_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
