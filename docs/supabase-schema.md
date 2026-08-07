# Esquema de Supabase

Snapshot del esquema tomado el 2026-08-07 desde el panel de Supabase. **No es una migración** —
el repo no tiene SQL versionado, este archivo es solo referencia. Si cambiás la base, actualizalo a mano.

Lo que **no** está capturado acá: políticas RLS, triggers, y el cuerpo de las funciones/RPCs.

## Enums implícitos (CHECK constraints)

Los estados se modelan con `text` + CHECK, no con tipos enum. Valores válidos:

| Tabla.columna | Valores | Default |
|---|---|---|
| `tournaments.status` | `upcoming`, `active`, `finished` | `upcoming` |
| `tournaments.type` | `league`, `world_cup`, `cup` | `league` |
| `rounds.status` | `pending`, `open`, `locked`, `finished` | `closed` ⚠️ |
| `matches.status` | `pending`, `open`, `closed`, `finished` | `pending` |
| `matches.playoff_stage` | `32avos`, `16avos`, `octavos`, `cuartos`, `semifinal`, `final` (o NULL) | NULL |
| `profiles.role` | `admin`, `user` | `user` |
| `world_cup_predictions.argentina_stage` | `fase_de_grupos`, `dieciseisavos`, `octavos`, `cuartos`, `semifinal`, `tercer_puesto`, `subcampeon`, `campeon` | NULL |

⚠️ **Bug latente**: el default de `rounds.status` es `'closed'`, que **no está en su propio CHECK**
(`pending`/`open`/`locked`/`finished`). Cualquier INSERT en `rounds` que no especifique `status`
explícitamente va a fallar. Los INSERT actuales pasan el status, por eso no salta.

Ojo también con la asimetría: `rounds` usa `locked` y `matches` usa `closed` para el estado equivalente.

## Tablas

### Núcleo del prode

- **`tournaments`** — `id`, `slug` (unique), `name`, `season`, `type`, `status`. Es la raíz del scope
  multi-torneo. El `slug` es la clave que matchea con `src/config/tournaments.config.js`.
- **`teams`** — `id`, `name` (unique), `slug` (unique), `logo_url`. Global, **sin `tournament_id`**:
  los equipos se comparten entre torneos.
- **`rounds`** — `round_number`, `status`, `opens_at`, `closes_at`, `name`, `tournament_id`.
  `name` es opcional; si está vacío la UI cae a `Fecha N` (`src/utils/roundLabels.js`).
- **`matches`** — `match_date`, `home_score`, `away_score`, `is_finished`, `round_number`,
  `match_number`, `is_playoff`, `playoff_stage`, `qualifier_team_id`, `group_label`, `tournament_id`.
  FKs a `teams` para local, visitante y clasificado por penales.
- **`predictions`** — `user_id` + `match_id`, `home_prediction`, `away_prediction` (ambos `>= 0`),
  `points`, `qualifier_prediction_id`. El upsert del cliente usa `onConflict: 'user_id,match_id'`,
  o sea que existe un unique sobre ese par (no aparece en el DDL de arriba pero está).
  **No tiene `tournament_id`**: el scope llega por join con `matches`.
- **`round_scores`** — `user_id`, `round_number`, `total_points`, `tournament_id` (NOT NULL).
  Lo escribe el servidor; el cliente solo lee. Es la fuente de la tabla de posiciones.

### Bonus del Mundial

- **`world_cup_bonus_config`** — PK `tournament_id`. `enabled`, `lock_at`, `is_locked`,
  `locked_at`, `locked_by`. **El cierre de las predicciones mundialistas depende solo de estas
  columnas**, no de fechas de partido.
- **`world_cup_teams`** — qué selecciones participan de cada mundial.
- **`world_cup_predictions`** — las 14 respuestas bonus por usuario y torneo.
- **`world_cup_official_results`** — PK `tournament_id`. Las respuestas correctas + `published_at`.
- **`world_cup_bonus_scores`** — PK (`tournament_id`, `user_id`). `breakdown` jsonb y `total_points`
  con CHECK `0..50`, que coincide con `WORLD_CUP_BONUS_MAX_POINTS` en `src/constants/worldCupBonus.js`.

### Pagos y finanzas (sin UI cableada)

Estas tablas tienen hooks y componentes (`AdminPayments/`, `AdminFinance/`) pero **no están
conectados a ninguna vista**.

- **`payments`** — pago global de un usuario. **Sin `tournament_id`.**
- **`payment_allocations`** — imputa un pago a una `round_number`. Sí tiene `tournament_id`.
- **`round_payments`** — PK (`round_number`, `user_id`), `has_paid`. **Sin `tournament_id`** —
  por eso existen las RPC `*_by_tournament` como variante nueva y las viejas como fallback.
- **`round_finances`** — PK `round_number` (⚠️ **no** incluye `tournament_id` en la PK, así que
  dos torneos no pueden tener finanzas para la misma `round_number`), `entry_fee_amount` (default 2000),
  `prize_amount`.

### Auth

- **`profiles`** — PK = `auth.users.id`. `username` (unique), `full_name`, `avatar_url`, `role`.
  `role = 'admin'` es lo que habilita la sección de administración (`isAdmin()` en `AuthContext`).

## Vistas y RPCs

`general_leaderboard` es una vista (la usa `useLeaderboard` cuando no hay torneo activo).

Las RPCs están inventariadas en `CLAUDE.md`. Varias existen en pares
`nombre` / `nombre_by_tournament` — la segunda es la versión con scope de torneo y el cliente
intenta esa primero, cayendo a la legacy si falla.

## Pendiente de documentar

- **Políticas RLS**: no capturadas. Importa saber si alguna restringe escrituras según el estado
  del torneo — hoy todos los guards de "torneo finalizado = solo lectura" son client-side.
- **Triggers**: el cálculo de puntos (`predictions.points` y `round_scores.total_points`) ocurre
  server-side, pero no está documentado si es por trigger sobre `matches` o dentro de una RPC.
