# Pendientes

Lo único que queda abierto del proyecto, en un solo lugar. Para **arrancar una conversación
nueva sin contexto previo**. Verificado contra el código y la base el **2026-11-27**.

**El refactor (fases 0 a 9) está terminado y en `main`** (fases 5 a 8 con el PR #9). Los
registros de cada fase se borraron: están en el historial de git. El último commit que los
tiene es `4f3c8ff`. Ahí también está el SQL que se aplicó en la fase 9 (`docs/plan-fase-9.md`):
A1, el trigger que impide cambiarse el `role`, y A2, las policies que rechazan escrituras en
torneos no `active`.
El SQL que se aplicó el 27/11 para el admin nuevo (progreso solo con jugadores del torneo y
default de `rounds.status`), con su rollback, está en `docs/plan-admin.md`, Task 1, en el
historial de git.

Nada de esta lista bloquea nada. Cada punto dice qué es y si conviene hacerlo.

| # | Qué | Tipo | Riesgo si no se hace |
| --- | --- | --- | --- |
| 1 | [Seguridad: cutoff y pronósticos ajenos](#1-seguridad) | SQL | **alto**: se puede pronosticar con el partido empezado y ver los pronósticos ajenos antes |
| 2 | [Importar fechas desde ESPN](#2-importar-fechas-desde-espn) | feature | — |
| 3 | [Limpieza de esquema](#3-limpieza-de-esquema) | SQL | nulo: prolijidad |
| 4 | [Decisiones de producto chicas](#4-decisiones-de-producto-chicas) | producto | nulo |
| 5 | [Deuda de TypeScript y tests](#5-deuda-de-typescript-y-tests) | código | nulo: no cambia comportamiento |
| 6 | [Datos de prueba sueltos](#6-datos-de-prueba-sueltos) | base | nulo |

---

## 1. Seguridad

La app habla directo con Supabase con la clave pública. **Toda la seguridad real vive en
RLS, triggers y funciones**: cualquier guard del cliente se saltea con un `fetch`.

| # | Problema | Estado |
| --- | --- | --- |
| 1 | Se puede pronosticar con el partido empezado o terminado (el cutoff es solo UI) | confirmado |
| 2 | Los pronósticos ajenos se leen por API antes de que empiece el partido | confirmado (`Predictions are viewable by everyone`) |
| 3 | `predictions.points` probablemente editable por el dueño (mismo patrón que tenía `role`) | **sin verificar** |
| 4 | RPCs de admin y varias tablas nunca probadas contra un no-admin | **sin verificar** |
| 5 | El trigger de `role` cubre UPDATE, no el alta (metadata de `signUp`) | **sin verificar** |
| 6 | Funciones `SECURITY DEFINER` sin `search_path` | parcial: `can_predict` **ya lo tiene** (`public, extensions`) |
| 7 | Menores: contraseña de 6, `img-src https:`, sin migraciones versionadas | — |

1 y 2 juntos son lo grave: permiten mirar el partido, ver qué puso el puntero y cargar el
resultado en el minuto 90. En la fase 9 el cutoff quedó como opcional porque solo se explota
usando la API a mano; en un prode, ese es justamente el incentivo.

### El flujo

1. El asistente escribe el SQL, su rollback y cómo lo va a verificar.
2. Se aplica. **Ahora el MCP de Supabase está conectado**, así que el asistente puede leer y
   aplicar con tu confirmación; antes lo aplicabas vos desde el panel.
3. Se verifica en el acto con `curl` + el JWT de `test-colo` (capa de datos) y Playwright con
   tu sesión (regresión del flujo real).
4. Si quedó mal, rollback.

**No hay staging**: la base es la de producción. S2 y S3 tocan el guardado y la lectura de
pronósticos, así que **se aplican sin una fecha en juego**. Prerequisito: `test-sandbox` con un
partido futuro y uno jugado (`docs/sandbox-partidos-futuros.sql`).

### S0 — Inventario de la base (solo lectura, riesgo nulo)

Todo lo que sigue depende de cosas que el esquema generado no muestra. Con el MCP, el
asistente lo puede correr solo y volcarlo a `docs/supabase-schema.md`.

```sql
-- 1. Policies
select tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies where schemaname = 'public' order by tablename, cmd;

-- 2. Triggers propios
select tgrelid::regclass as tabla, tgname, tgenabled, pg_get_triggerdef(oid)
from pg_trigger where not tgisinternal order by 1, 2;

-- 3. Funciones: quién es SECURITY DEFINER y quién no tiene search_path
select p.proname, pg_get_function_identity_arguments(p.oid) as args,
       p.prosecdef as security_definer, p.proconfig as config
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' order by 1;

-- 4. Cuerpos de las que importan
select p.proname, pg_get_functiondef(p.oid)
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname in (
  'handle_new_user', 'is_admin', 'can_predict',
  'recalculate_round', 'recalculate_round_scores', 'reset_round',
  'admin_set_world_cup_lock', 'admin_lock_world_cup_predictions',
  'recalculate_world_cup_bonus', 'upsert_world_cup_prediction',
  'get_round_predictions_summary_by_tournament',
  'get_round_predictions_summary_by_tournament_v2',
  'get_tournament_leaderboard_with_bonus', 'get_personal_stats'
);

-- 5. Tipos y defaults que usa el SQL de abajo
select table_name, column_name, data_type, column_default
from information_schema.columns
where table_schema = 'public'
  and (table_name, column_name) in (('matches','match_date'), ('predictions','points'));
```

Además: **Security Advisor** del panel (Advisors → Security), o `get_advisors` por el MCP.

**Preguntas que S0 tiene que contestar:**

- ¿El recálculo (`recalculate_round*`) escribe `predictions.points`? ¿Es `SECURITY DEFINER`?
  → define la guarda de S2 y S4.
- ¿`get_round_predictions_summary_*`, `get_personal_stats` y
  `get_tournament_leaderboard_with_bonus` son `SECURITY DEFINER`? → si alguna no lo es, S3 le
  recorta datos.
- ¿Las RPCs `admin_*` / `recalculate_*` / `reset_round` chequean `is_admin()`? → S5.
  (`admin_set_world_cup_lock` sí, verificado el 27/11.)
- ¿`handle_new_user` copia algo de `raw_user_meta_data` más allá de `username` y `full_name`?
  ¿Hay policy de INSERT en `profiles`? → S5.

### S1 — Verificaciones con `test-colo` (sin cambios en la base)

**Solo después de S0**: llamar una RPC de admin sin haber leído su cuerpo puede ser destructivo
si no tiene guard. Todo contra filas de `test-sandbox`.

1. **`points`**: `PATCH /predictions?id=eq.<pronóstico propio en sandbox> {points: 99}`. Si
   queda en 99 → S4 es necesaria. Revertir en el acto.
2. **Tablas sin probar**: `PATCH` sobre una fila de sandbox en `round_scores`,
   `world_cup_official_results`, `world_cup_bonus_config`, `world_cup_bonus_scores`,
   `world_cup_teams`, `teams`, `tournaments`. Esperado: 0 filas o `42501`.
3. **RPCs de admin**: solo las que S0 muestre **con** guard se llaman para confirmar el
   rechazo. Las que no lo tengan van directo a S5.
4. **Bonus del Mundial**: ¿`test-colo` lee las `world_cup_predictions` de otros antes del
   bloqueo? ¿`upsert_world_cup_prediction` acepta escribir con el bloqueo puesto?

### S2 — Cutoff de pronósticos en la base (problema 1)

**Un trigger que devuelve `NULL`, no una policy.** El guardado es un batch: una policy que
rechaza una fila tira abajo el batch entero. Un trigger `BEFORE ... FOR EACH ROW` que devuelve
`NULL` **descarta solo esa fila**, sin error. También funciona dentro del upsert.

**El corte es al inicio del partido, no 10 minutos antes.** El cliente corta a −10 min con el
reloj del dispositivo. Si la base cortara igual, un usuario con el reloj atrasado vería
"guardado" y perdería filas en silencio. Cortando en `match_date` quedan 10 minutos de margen y
el agujero real (pronosticar con el partido en juego) se cierra igual.

**Solo mira los campos del pronóstico.** Si el recálculo hace `UPDATE predictions SET points`
sobre partidos jugados, un trigger que bloquee todo UPDATE posterior **rompería el scoring en
silencio**.

```sql
create or replace function public.enforce_prediction_cutoff()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_match_date timestamptz;
begin
  if tg_op = 'UPDATE'
     and new.home_prediction is not distinct from old.home_prediction
     and new.away_prediction is not distinct from old.away_prediction
     and new.qualifier_prediction_id is not distinct from old.qualifier_prediction_id then
    return new;
  end if;

  if auth.uid() is null then
    return new;
  end if;

  select m.match_date into v_match_date from public.matches m where m.id = new.match_id;

  if v_match_date is null or now() >= v_match_date then
    return null;
  end if;

  return new;
end;
$$;

create trigger trg_enforce_prediction_cutoff
  before insert or update on public.predictions
  for each row
  execute function public.enforce_prediction_cutoff();
```

**Rollback:**

```sql
drop trigger if exists trg_enforce_prediction_cutoff on public.predictions;
drop function if exists public.enforce_prediction_cutoff();
```

`can_predict` ya tiene `search_path`; si nada la usa, se puede borrar en vez de cablear.

**Verificación:**

1. `test-colo` inserta en un partido futuro del sandbox → se guarda.
2. Inserta en un partido jugado → `201` con `[]`; una lectura independiente confirma que no
   existe.
3. Cambia un pronóstico que ya tiene en un partido jugado → queda igual.
4. Un upsert batch mezclando las dos cosas → la futura se guarda y la pasada no.
5. **Regresión crítica**: el admin recalcula una fecha del sandbox → los `points` se
   actualizan. Si no, el trigger cerró de más: rollback.
6. Playwright: guardar en `/pronosticos` del sandbox con el flujo real.

**Cambio de cliente que acompaña** (chico, en una rama): `batchUpsert` hace `.select()`, así
que sabe cuántas filas volvieron. Si son menos de las enviadas, `PredictionForm` avisa "algunos
partidos ya cerraron y no se guardaron" en vez de mostrar éxito. Más el comentario de
`utils/matchTiming.ts` y `usePredictions.ts`, que hoy dice que "la base no lo valida".

**Riesgo:** medio. Es la que toca el guardado real; el paso 5 es el que importa.

### S3 — Pronósticos ajenos solo con el partido empezado (problema 2)

Policy `RESTRICTIVE`: se combina con AND con la lectura pública actual, sin tocarla.

```sql
create policy "predictions_select_propias_o_partido_empezado"
  on public.predictions
  as restrictive
  for select
  to public
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.matches m
      where m.id = predictions.match_id and m.match_date <= now()
    )
  );
```

Agregar `or public.is_admin()` **solo** si S0 muestra que alguna RPC que lee pronósticos ajenos
(el progreso de `RoundManager`) no es `SECURITY DEFINER`. Sin necesidad, no: el admin también
juega.

**Rollback:**
`drop policy if exists "predictions_select_propias_o_partido_empezado" on public.predictions;`

**Compatibilidad con el cliente, ya revisada:** la única lectura directa de pronósticos ajenos
es `useAllPredictions`, que ya consulta solo partidos empezados. `usePredictions`,
`usePlayoffs` y `usePersonalStats` leen solo los del usuario. Lo que puede romperse son las
RPCs si no son `SECURITY DEFINER`.

**Verificación:** `test-colo` lee pronósticos ajenos en un partido futuro → `[]`; en uno jugado →
los ve; los propios en uno futuro → los ve. Regresión con Playwright: "Ver pronósticos", tabla
de posiciones, estadísticas y el progreso de `/admin/fechas`.

**Riesgo:** bajo-medio.

**Bonus del Mundial:** si S1.4 muestra que las respuestas ajenas se leen antes del bloqueo, va
una policy análoga en `world_cup_predictions`. Pero `useWorldCupBonus` cuenta las filas de
todos (`count: 'exact', head: true`) y con la policy contaría solo la propia: el contador
tendría que salir de una RPC `SECURITY DEFINER`. Es para el próximo Mundial.

### S4 — `points` no editable por el dueño (si S1.1 lo confirma)

Mismo patrón que el trigger de `role`, pero la guarda es `current_user` y no `auth.uid()`: el
recálculo lo dispara un admin logueado.

```sql
create or replace function public.prevent_prediction_points_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user = 'authenticated' and not public.is_admin() then
    if tg_op = 'INSERT' then
      new.points := 0;
    elsif new.points is distinct from old.points then
      new.points := old.points;
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_prevent_prediction_points_change
  before insert or update on public.predictions
  for each row
  execute function public.prevent_prediction_points_change();
```

El `0` del INSERT es el default de la columna: confirmarlo con S0.5. **Verificación:** repetir
S1.1 → queda el valor anterior; un pronóstico normal se sigue guardando; **el admin recalcula y
los puntos cambian**.

### S5 — Lo que salga de S0/S1 (problemas 4, 5 y 6)

- **RPC de admin sin guard** → al principio
  `if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;`
  y `set search_path = public`.
- **Tabla escribible que no debería** → policy de escritura solo para `is_admin()`.
- **`handle_new_user` que lee `role` de la metadata** → forzar `'user'`. Si hay policy de
  INSERT en `profiles`, el trigger de `role` pasa a `before insert or update`.
- **Funciones con `search_path` mutable** → `alter function … set search_path = public;`.

### S6 — Menores

- **Contraseña**: mínimo 8 en Auth → Providers → Email, y en `Login` y `UserProfile` (hoy 6).
  Si el plan lo incluye, *leaked password protection*.
- **CSP `img-src https:`**: achicar a los hosts reales. Primero
  `select distinct substring(logo_url from '^https?://[^/]+') from teams;` (y lo mismo con
  `profiles.avatar_url`). Verificar en un preview de Vercel que no falte ningún escudo.
- **Migraciones versionadas**: adoptar `supabase/migrations/` (`supabase db pull` arma la base
  inicial). Hoy el SQL aplicado solo vive en documentos y en el historial de git.

### Orden

S0 ya, sin riesgo → S1 → **S2** (la que más importa, sin fecha en juego) → S3 en la misma
ventana → S4/S5 según lo que salga → S6 cuando quieras. Con **S2 + S3** lo grave está cerrado.

---

## 2. Importar fechas desde ESPN

Diseño en `docs/diseno-importar-fecha-espn.md`, **pendiente de tu revisión**. Después va el plan
de implementación. El botón va en la pantalla de Fechas (`RoundManager`), arriba del progreso. Los cuartos del Clausura 2026 ya se cargaron a mano con este método el 27/11.

Toca dos puntos de esta lista: agrega `matches.external_id` (conviene antes o junto con borrar
`matches.status`, punto 3) y su RPC repite en SQL el cierre de 10 minutos (se cruza con S2).

## 3. Limpieza de esquema

Nada de esto rompe nada hoy. Era la "entrega B" de la fase 9.

- **`NOT NULL` en `matches.tournament_id` y `rounds.tournament_id`.** Siguen nullables al 27/11.
  Lo más sano de la lista. Rollback trivial (`drop not null`).
  ```sql
  alter table public.matches alter column tournament_id set not null;
  alter table public.rounds  alter column tournament_id set not null;
  ```
- **Borrar `matches.status`** (columna muerta: el cliente no la lee). Antes, confirmar en
  `pg_depend` y en los cuerpos de función que nada la referencia. Después `pnpm types:db` y
  `pnpm typecheck`.
- **Vistas sin uso** (`general_leaderboard_by_tournament`, `leaderboard`, `round_leaderboard`) y
  **la superficie de pagos** (`payments`, `payment_allocations`, `round_payments`,
  `round_finances` + sus funciones). Siguen todas al 27/11. `DROP` de alto riesgo: revisar
  `pg_depend` antes. Si algún día se retoma la feature de pagos, ojo: `round_finances` y
  `round_payments` no tienen `tournament_id`.
- **Funciones viejas de puntos**: `recalculate_round` y `recalculate_round_scores` escriben en
  `round_scores` **sin `tournament_id`**. Nadie las llama (los puntos los calcula el trigger
  `update_points_on_match_result`), pero si alguien lo hiciera mezclaría puntos entre torneos.
  Conviene borrarlas, con el mismo cuidado de `pg_depend`.
- **Reducir `docs/supabase-schema.md`** a lo que el generador no cubre (RLS, triggers),
  idealmente con el resultado de S0.
- ~~Índices en `matches` y `round_scores` por torneo y fecha~~: **ya existen**
  (`idx_matches_tournament_round`, `idx_round_scores_tournament_round`).

## 4. Decisiones de producto chicas

- **El `marginTop: 36px` de `MatchManager/MatchResult`** está duplicado en
  `MatchHeader.module.css`: las dos tarjetas implementan por su cuenta el patrón "badge absoluto
  arriba + contenido corrido". La regla del clasificado ya se unificó (`qualifier.ts` +
  `Common/QualifierPicker`); falta este literal.
- **`/admin/mundial` nunca se abrió después de la fase 8**: `AdminRoute` exige torneo no
  finalizado y el único Mundial está `finished`. Se mira cuando haya un Mundial activo.
- **El globito del suspendido no se renderiza nunca**: `SUSPENDED_PLAYERS` son los mismos
  nombres que dos grupos de `constants/hiddenPlayers`, y `useLeaderboard` filtra los ocultos.
  Hay que decidir si esos jugadores van ocultos o suspendidos.
- **El esqueleto de pronósticos queda corto en una fecha con avisos** (la tarjeta real crece).
  Es de gusto: si molesta, se ajusta.
- **El área táctil del `InfoButton`** es 39×32.5: pasa el mínimo WCAG (24) y no la
  recomendación (44). Un intento de agrandarla sin cambiar lo visible se revirtió.
- **`QualifierPicker` es un `radiogroup` con dos tab stops** en vez del tab stop único con
  flechas que pide APG. No está roto. Se rediseñó el 17/11 (dos botones lado a lado) sin cambiar
  esto.

## 5. Deuda de TypeScript y tests

No cambia comportamiento ni aspecto. Se hace cuando haya ganas.

**`strict`, medido el 27/11** con `tsc --noEmit --<flag>`:

| Flag | Errores |
| --- | --- |
| `strictPropertyInitialization` | 1 |
| `useUnknownInCatchVariables` | 12 |
| `noImplicitAny` | 89 (eran 100) |
| `strictNullChecks` | 123 |

Ir flag por flag, de menor a mayor: las dos primeras son una tarde. `noImplicitAny` y
`strictNullChecks` bajan solas al tocar archivos por otra razón. Una parte de los de
`strictNullChecks` son los argumentos de las RPC del bonus del Mundial declarados no nullables:
se arreglan en la base, no peleándolos desde TypeScript.

**Tests:** los 58 archivos siguen en `.js`. Migrarlos es trabajo de fixtures (un fixture parcial
falla por propiedades faltantes), así que va junto con `strictNullChecks`, con factories que
armen objetos completos.

**`useAllPredictions` no devuelve `error`**: "Ver pronósticos" falla en silencio. Es el único
hook de datos así y le falta test propio. Arreglo chico de cliente; el más útil de esta sección.

**Renombres de convención** (los cinco siguen al 27/11). Van en un commit propio:

- `LeaderBoard/LeadboardHeader/`: le falta la "er".
- `LeaderBoard` vs `LeaderboardRow` vs `useLeaderboard`: tres capitalizaciones del mismo nombre.
- `Navigation/Sidebar/Views/`: carpeta plural con un solo hijo.
- `TournamentSelector/TournamentCard.tsx`: archivo plano donde el resto usa `Componente/index.tsx`.
- `.gitignore` mantiene `!src/config/*.config.js`, que quedó vestigial (el archivo es `.ts`).

En Windows un cambio de capitalización a secas no lo ve git: `git mv` en dos pasos o
`git mv --force`.

También: `src/hooks/useWorldCupBonus.ts` cita `docs/pruebas-fase-3b.md`, que ya no existe.

## 6. Datos de prueba sueltos

- Dos pronósticos de `test-colo` que RLS no le deja borrar al dueño: un `2-1` en `test-sandbox`
  (fecha 6, partido 4, `id 10db5a14-…`) y un `7-7` en `mundial-2026`. Inocuos.
- `test-vacio` sigue en `finished` (quedó así para probar A2). Se puede devolver a `active`.
- `test-sandbox`, fecha 7: 4 partidos a futuro (ya pasados) y 4 pronósticos del admin, de la
  fase 8. El rollback está al final de `docs/sandbox-partidos-futuros.sql`.

---

## Anexo: cómo se verifica un cambio visual

Lo que funcionó en las fases 6 y 8, para la próxima vez que haga falta comparar antes/después:

1. `git worktree add <tmp> <commit-anterior>` y una junction a `node_modules`
   (`New-Item -ItemType Junction`). Copiar el `.env`.
2. Un segundo `vite --port 5199` sobre el worktree **con su propio `cacheDir`**. Es
   obligatorio: la junction comparte `node_modules/.vite` y el segundo server le cambia la copia
   de React al primero (`Cannot read properties of null (reading 'useRef')`).
   ```js
   import { defineConfig, mergeConfig } from 'vite'
   import base from './vite.config.js'
   export default mergeConfig(base, defineConfig({ cacheDir: './.vite-diff' }))
   ```
   Si ya se rompió: matar los dos servers, borrar `node_modules/.vite` y levantar de nuevo.
3. Playwright sobre los dos puertos copiando el `localStorage` para llevar la sesión: un
   Chromium headed con `--remote-debugging-port`, login a mano una vez y `connectOverCDP`.
   `playwright-core` instalado fuera del repo.
4. Medir `getComputedStyle` de nodos identificables por contenido, no por posición, y diffear.
   Incluir `margin`.
5. Si un diff parece implausible, **arreglar el medidor antes de creerle**. Y si da 0, verificar
   que las dos versiones estaban en la misma ruta, con los mismos datos.

Para medir un estado de carga hay que retenerlo (`page.route` y resolver a mano). El tema no se
cambia con `setAttribute('data-theme')`: va por `localStorage.setItem('theme', ...)` antes de
cargar, porque el tema del torneo escribe la paleta inline en el root.
