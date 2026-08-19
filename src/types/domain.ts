/**
 * Los tipos del dominio, derivados del esquema real.
 *
 * `database.ts` lo genera Supabase desde la base (`supabase gen types typescript`),
 * así que **es la verdad y no se edita a mano**. Este archivo le pone los nombres
 * del dominio y guarda lo que el generador no puede saber: por qué una columna está
 * muerta, cuál es el default roto, qué garantiza el cliente y qué no.
 *
 * Antes las interfaces estaban escritas a mano acá, verificadas contra la base
 * consultando fila por fila. Aun así varias estaban mal —ver el registro de la fase
 * 7—: escribir tipos a mano es afirmar, no comprobar.
 *
 * Para regenerar: `pnpm types:db` (necesita `supabase login`).
 */
import type { Database } from './database'

type PublicSchema = Database['public']

/** La fila de una tabla: `Tables<'matches'>`. */
export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row']

/** La fila de una vista: `ViewRow<'general_leaderboard'>`. */
export type ViewRow<T extends keyof PublicSchema['Views']> = PublicSchema['Views'][T]['Row']

/** Los argumentos y el retorno de una RPC: `Fn<'get_personal_stats'>['Returns']`. */
export type Fn<T extends keyof PublicSchema['Functions']> = PublicSchema['Functions'][T]

/** Un `uuid` de Postgres. Alias por documentación: no agrega seguridad. */
export type Uuid = string

/** Un `timestamptz` serializado, o sea lo que llega por JSON. */
export type IsoDate = string

// ---------------------------------------------------------------- Estados
//
// Los estados se modelan con `text` + CHECK y no con tipos enum de Postgres, así
// que el esquema generado los da como `string | null`: un CHECK no viaja al tipo
// (`Enums` viene vacío, lo confirma). Estas uniones son el vocabulario válido y
// sirven para comparar y estrechar, pero **no son el tipo de la columna**: poner
// `status: TournamentStatus` en la fila sería volver a afirmar sin comprobar.

export type TournamentStatus = 'upcoming' | 'active' | 'finished'
export type TournamentType = 'league' | 'world_cup' | 'cup'

/**
 * El CHECK de `rounds.status`.
 *
 * **Ojo**: el default de la columna en la base es `'closed'`, un valor que no está
 * en su propio CHECK (es la deuda de esquema que documenta el plan), así que una
 * fila puede traer algo fuera de esta unión. `RoundManager/roundStatus.js` lo
 * normaliza con `getRoundStatus()`, que cae a `pending`.
 */
export type RoundStatus = 'pending' | 'open' | 'locked' | 'finished'

/**
 * El CHECK de `matches.status`. El cliente **no lo usa**: decide con
 * `is_finished`. Elegir una de las dos y borrar la otra es parte de la fase 9.
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

// ---------------------------------------------------------------- Filas

/** La raíz del scope multi-torneo. El `slug` matchea con `tournaments.config.js`. */
export type Tournament = Tables<'tournaments'>

/** Global y **sin `tournament_id`**: los equipos se comparten entre torneos. */
export type Team = Tables<'teams'>

/**
 * Ojo con `tournament_id`: es **nullable** en la base. Una fecha sin torneo no
 * debería existir, pero el esquema la permite, y toda la separación entre torneos
 * depende de esa columna.
 */
export type Round = Tables<'rounds'>

/**
 * Ojo con dos columnas:
 *
 * - `is_finished` es **nullable**, y es la que decide media app (qué fecha tiene
 *   tabla propia, qué partido entra en las estadísticas). Un `null` se lee como
 *   falso en todos los usos actuales, que es lo que se quiere, pero es una
 *   ausencia y no un "no terminó".
 * - `tournament_id` también es nullable, igual que en `rounds`.
 */
export type Match = Tables<'matches'>

/**
 * **No tiene `tournament_id`**: el scope llega por join con `matches`. Hay un
 * unique sobre (`user_id`, `match_id`), que es el `onConflict` del upsert.
 *
 * `points` es nullable y lo escribe el servidor; el cliente nunca lo calcula.
 */
export type Prediction = Tables<'predictions'>

/** La fuente de la tabla de posiciones. La escribe el servidor; el cliente lee. */
export type RoundScore = Tables<'round_scores'>

/**
 * PK = `auth.users.id`. `role === 'admin'` es lo que habilita administración.
 *
 * `full_name` es nullable, y varias pantallas lo muestran directo o lo comparan
 * contra listas de nombres (`SUSPENDED_PLAYERS`, `filterHiddenPlayers`).
 */
export type Profile = Tables<'profiles'>

/** Las 14 respuestas bonus de un usuario en un torneo, más su auditoría. */
export type WorldCupPrediction = Tables<'world_cup_predictions'>

// ---------------------------------------------------------------- Derivados

/** El subconjunto de `Team` que viene embebido en los partidos. */
export type TeamSummary = Pick<Team, 'id' | 'name' | 'slug' | 'logo_url'>

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
 *
 * Los embebidos van nullable aunque `home_team_id` y `away_team_id` no lo sean: si
 * el embed no encuentra la fila, PostgREST devuelve null, y el código se defiende
 * de eso (ver `utils/stats/teamReads.ts`, que solo cuenta el partido si están los
 * dos).
 */
export interface MatchWithTeams extends Match {
  home_team: TeamSummary | null
  away_team: TeamSummary | null
  qualifier_team: TeamSummary | null
}
