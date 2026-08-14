/**
 * Los tipos de las filas que el cliente lee de Supabase.
 *
 * Están escritos a mano y **verificados contra la base**, no copiados de
 * `docs/supabase-schema.md`: los nombres de columna y los tipos salieron de
 * consultar cada tabla, y la nulabilidad de lo que el snapshot documenta más lo
 * que el código ya defiende con `?.`. Cuando se adopte `supabase gen types
 * typescript` (fase 9, junto con las migraciones versionadas), esto pasa a ser un
 * alias de los tipos generados y deja de mantenerse a mano.
 *
 * Convención: un tipo por tabla, con el nombre en singular. Las uniones de estado
 * replican los CHECK constraints, que es la única forma de enum que usa la base.
 */

/** Un `uuid` de Postgres. Alias por documentación: no agrega seguridad. */
export type Uuid = string

/** Un `timestamptz` serializado, o sea lo que llega por JSON. */
export type IsoDate = string

// ---------------------------------------------------------------- Estados

export type TournamentStatus = 'upcoming' | 'active' | 'finished'
export type TournamentType = 'league' | 'world_cup' | 'cup'

/**
 * El CHECK de `rounds.status`.
 *
 * **Ojo**: el default de la columna en la base es `'closed'`, un valor que no
 * está en su propio CHECK (es la deuda de esquema que documenta el plan). Por eso
 * `Round.status` se tipa como `string` y no como esta unión: una fila puede traer
 * algo fuera de acá. `RoundManager/roundStatus.js` lo normaliza con
 * `getRoundStatus()`, que cae a `pending`.
 */
export type RoundStatus = 'pending' | 'open' | 'locked' | 'finished'

/**
 * El CHECK de `matches.status`. El cliente **no lo usa**: decide con
 * `is_finished`. Está tipado porque la columna existe y viene en los `select *`,
 * pero elegir una de las dos y borrar la otra es parte de la fase 9.
 *
 * Notar la asimetría con `RoundStatus`: acá el estado equivalente a `locked` se
 * llama `closed`.
 */
export type MatchStatus = 'pending' | 'open' | 'closed' | 'finished'

export type PlayoffStage = '32avos' | '16avos' | 'octavos' | 'cuartos' | 'semifinal' | 'final'

export type ProfileRole = 'admin' | 'user'

/** Hasta dónde llega Argentina, una de las 14 preguntas bonus del Mundial. */
export type ArgentinaStage =
  | 'fase_de_grupos'
  | 'dieciseisavos'
  | 'octavos'
  | 'cuartos'
  | 'semifinal'
  | 'tercer_puesto'
  | 'subcampeon'
  | 'campeon'

// ---------------------------------------------------------------- Núcleo

/** La raíz del scope multi-torneo. El `slug` es lo que matchea con `tournaments.config.js`. */
export interface Tournament {
  id: Uuid
  slug: string
  name: string
  season: string
  type: TournamentType
  status: TournamentStatus
  created_at: IsoDate
  updated_at: IsoDate
}

/** Global y **sin `tournament_id`**: los equipos se comparten entre torneos. */
export interface Team {
  id: Uuid
  name: string
  slug: string
  logo_url: string | null
  created_at: IsoDate
}

/** El subconjunto de `Team` que viene embebido en los partidos. */
export type TeamSummary = Pick<Team, 'id' | 'name' | 'slug' | 'logo_url'>

export interface Round {
  id: Uuid
  round_number: number
  /** Puede traer un valor fuera de `RoundStatus`; ver la nota de esa unión. */
  status: string
  /** Opcional: si está vacío, la UI cae a `Fecha N` (`utils/roundLabels.js`). */
  name: string | null
  /** Sin uso en el cliente: la fecha activa se deriva de los `match_date`. */
  opens_at: IsoDate | null
  closes_at: IsoDate | null
  tournament_id: Uuid
  created_at: IsoDate
  updated_at: IsoDate
}

export interface Match {
  id: Uuid
  match_date: IsoDate
  /** `null` mientras el partido no tenga resultado cargado. */
  home_score: number | null
  away_score: number | null
  is_finished: boolean
  status: MatchStatus
  round_number: number
  match_number: number
  home_team_id: Uuid
  away_team_id: Uuid
  is_playoff: boolean
  playoff_stage: PlayoffStage | null
  /** Quién clasificó por penales. Solo en playoffs. */
  qualifier_team_id: Uuid | null
  /** El grupo del Mundial (`A`..`L`). Null en los torneos de liga. */
  group_label: string | null
  tournament_id: Uuid
  created_at: IsoDate
}

/**
 * Lo que trae `useMatchesMeta`, la consulta compartida de "todos los partidos del
 * torneo". Su select es un superconjunto a propósito y lo consumen cinco
 * pantallas: si hace falta otra columna, se agrega ahí y acá, no en una query
 * nueva (ver CLAUDE.md).
 */
export type MatchMeta = Pick<
  Match,
  'id' | 'round_number' | 'match_date' | 'is_finished' | 'is_playoff'
>

/**
 * Un partido con los equipos embebidos, que es como lo devuelve `useMatches`
 * (`MATCH_WITH_TEAMS`). Los tres joins salen de la misma tabla `teams` y por eso
 * el select los desambigua nombrando la FK.
 */
export interface MatchWithTeams extends Match {
  home_team: TeamSummary
  away_team: TeamSummary
  qualifier_team: TeamSummary | null
}

/**
 * **No tiene `tournament_id`**: el scope llega por join con `matches`. Hay un
 * unique sobre (`user_id`, `match_id`), que es el `onConflict` del upsert.
 */
export interface Prediction {
  id: Uuid
  user_id: Uuid
  match_id: Uuid
  home_prediction: number
  away_prediction: number
  /** Lo escribe el servidor. El cliente nunca lo calcula. */
  points: number
  /** Solo en playoffs, y solo si el marcador pronosticado es empate. */
  qualifier_prediction_id: Uuid | null
  created_at: IsoDate
  updated_at: IsoDate
}

/** La fuente de la tabla de posiciones. La escribe el servidor; el cliente lee. */
export interface RoundScore {
  id: Uuid
  user_id: Uuid
  round_number: number
  total_points: number
  tournament_id: Uuid
}

/** PK = `auth.users.id`. `role === 'admin'` es lo que habilita administración. */
export interface Profile {
  id: Uuid
  username: string
  full_name: string
  avatar_url: string | null
  role: ProfileRole
  created_at: IsoDate
}

// ---------------------------------------------------------------- Mundial

/**
 * Las 14 respuestas bonus de un usuario en un torneo.
 *
 * Los nombres salen del mapa `toRpcParams` de `hooks/useWorldCupBonus.jsx`, que es
 * el contrato real con la RPC `upsert_world_cup_prediction` (a cada campo le
 * agrega el prefijo `p_`). No se pudo leer una fila para confirmar las columnas de
 * auditoría, así que acá están solo los campos que el cliente usa.
 */
export interface WorldCupPrediction {
  id: Uuid
  user_id: Uuid
  tournament_id: Uuid
  champion_team_id: Uuid | null
  runner_up_team_id: Uuid | null
  third_place_team_id: Uuid | null
  top_scorer_text: string | null
  best_player_text: string | null
  best_goalkeeper_text: string | null
  least_goals_conceded_team_id: Uuid | null
  revelation_team_id: Uuid | null
  most_assists_text: string | null
  most_cards_team_id: Uuid | null
  will_there_be_hat_trick: boolean | null
  argentina_stage: ArgentinaStage | null
  final_goals: number | null
  best_debutant_team_id: Uuid | null
}
