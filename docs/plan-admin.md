# Limpiar el admin: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** que las tres pantallas del admin (Fechas, Resultados, Horarios) sirvan para lo que se hace
cada semana en el celular: ver quién falta pronosticar, cargar resultados pendientes y corregir
horarios.

**Architecture:** tres PRs, uno por pantalla, cada uno desde `main`. El filtro de jugadores activos
va en la RPC de la base; el resto son funciones puras nuevas en `src/utils/` (con tests) y
componentes que las consumen. Se borra todo lo que maneja los estados de fecha.

**Tech Stack:** React 19 + TypeScript, TanStack Query, CSS modules, Vitest + Testing Library,
Supabase (SQL por el MCP).

**Spec:** `docs/diseno-admin.md`

## Global Constraints

- **No agregar comentarios en el código** (pedido del usuario). Los que ya existen se borran solo si
  describen algo que este plan elimina.
- Comandos con `npx -y pnpm@10 ...`. **No correr la suite completa sin OK del usuario**; los tests
  puntuales con `--maxWorkers=2`.
- Antes de cada commit: `npx -y pnpm@10 lint`, `npx -y pnpm@10 typecheck` y los tests tocados.
- Textos de UI en español rioplatense. Colores y medidas con las custom properties (`--color-*`,
  `--space-*`, `--font-size-*`, `--radius-*`); estilos nuevos en `*.module.css`, no inline.
- Commits en español con prefijo (`feat:`, `fix:`, `refactor:`, `docs:`). Ramas
  `feat/admin-fechas`, `feat/admin-resultados`, `feat/admin-horarios`, cada una desde `main`
  actualizado.
- Push: `gh auth switch -u colomarina` y
  `git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push`.
- **Escribir en la base (Task 1) requiere confirmación explícita del usuario**, mostrando el SQL.
- Verificación visual de cada PR en el navegador a **360 px** con sesión de admin, en el Clausura.

## Review Focus

- **Torneo activo sin fecha activa** (todos los partidos jugados, antes de pasar a `finished`):
  Fechas muestra un estado vacío, no una pantalla rota. → test en Task 4.
- **Fecha activa cuyos partidos todavía no llegaron** (`useMatches` cargando): la lista de faltantes
  cae al número (`#3`) en vez de romper. → test de `buildMatchLabels` en Task 4.
- **Resultados sin ningún pendiente**: abre en la última fecha cargable; sin ninguna, el
  `EmptyState` de hoy. → tests de `getPendingResultsRoundNumber` en Task 5.
- **Empate en un playoff**: al tipear 1-1 aparece el selector con el local propuesto, y al guardar
  se escribe ese `qualifier_team_id`. Con 2-1 no aparece y se escribe el ganador. → Task 6.
- **Horario editado y vuelto al original**: el "antes: …" desaparece. → test en Task 8.

---

# PR 1 — Fechas (`feat/admin-fechas`)

### Task 1: la RPC de progreso cuenta solo jugadores del torneo, y el default de `rounds.status`

**Files:** ninguno del repo. SQL contra Supabase (`wlvleuwcmrlgrxolityp`) por el MCP.

- [ ] **Step 1: Medir antes.** Correr y anotar (esperado hoy: 20 filas sin ocultos, 25 con):

```sql
select count(*) from public.get_round_predictions_summary_by_tournament_v2(
  '0c68f05a-95cb-426d-bc59-ccedcddeecf6', 18);
```

- [ ] **Step 2: Mostrarle al usuario el SQL y esperar su OK.** Es la definición actual de `_v2` con
  **una sola diferencia**: el `where exists` marcado dentro de `user_predictions`.

```sql
create or replace function public.get_round_predictions_summary_by_tournament_v2(
  p_tournament_id uuid, p_round_num integer)
returns table(round_number integer, user_id uuid, user_name text, total_matches integer,
  predicted_count integer, missing_matches integer[], progress numeric)
language plpgsql security definer
set search_path = public
as $function$
begin
  if p_round_num is null then return; end if;
  return query
  with round_matches as (
    select m.id, m.match_number from public.matches m
    where m.round_number = p_round_num and m.tournament_id = p_tournament_id
    order by m.match_number
  ), match_count as (
    select count(*) as total from round_matches
  ), user_predictions as (
    select p.id as user_id,
      coalesce(p.full_name, p.username, 'Usuario')::text as user_name,
      coalesce(count(distinct pr.id), 0)::integer as pred_count,
      array_agg(distinct rm.match_number order by rm.match_number)
        filter (where pr.id is not null) as predicted_matches
    from public.profiles p
    cross join match_count mc
    left join round_matches rm on true
    left join public.predictions pr on pr.user_id = p.id and pr.match_id = rm.id
    where exists (                                            -- ← nuevo
      select 1 from public.predictions pt
      join public.matches mt on mt.id = pt.match_id
      where pt.user_id = p.id and mt.tournament_id = p_tournament_id
    )
    group by p.id, p.username, p.full_name
  )
  select p_round_num, up.user_id, up.user_name,
    (select mc.total from match_count mc)::integer, up.pred_count,
    array(select rm2.match_number from round_matches rm2
          where rm2.match_number not in (
            select unnest(coalesce(up.predicted_matches, array[]::integer[])))
          order by rm2.match_number),
    case when (select mc.total from match_count mc) > 0
      then round((up.pred_count::numeric / (select mc.total from match_count mc)::numeric) * 100, 2)
      else 0 end
  from user_predictions up
  order by up.user_name;
end;
$function$;

alter table public.rounds alter column status set default 'pending';
```

  El `-- ← nuevo` es solo para mostrarlo: no va en el SQL que se aplica. De paso se le fija
  `search_path = public`, que hoy no tiene.

  **Rollback:** el mismo `create or replace` sin el bloque `where exists (...)` y sin el
  `set search_path`; y `alter table public.rounds alter column status set default 'closed';`.

- [ ] **Step 3: Aplicar** con `execute_sql` (es un `create or replace`, no DDL de tabla nueva).
- [ ] **Step 4: Verificar.** La consulta del Step 1 devuelve **7**. Y
  `select column_default from information_schema.columns where table_name='rounds' and column_name='status'`
  devuelve `'pending'::text`. Recargar `/admin/fechas`: el contador dice "de N" con N ≤ 7 (los
  ocultos se filtran en el cliente).

### Task 2: el 🏁 de "Ver pronósticos" sale de los partidos

**Files:**
- Modify: `src/utils/leaderboardRounds.ts`
- Modify: `src/components/AllPredictions/RoundUserSelectors/index.tsx:73-75`
- Test: `src/utils/leaderboardRounds.test.js`

**Interfaces:**
- Produces: `getFinishedRoundNumbers(matchesMeta: MatchMeta[] = []): Set<number>`: fechas con al
  menos un partido y **todos** `is_finished`.

- [ ] **Step 1: Tests que fallan**, en `describe('getFinishedRoundNumbers')`:
  - `[{round 1, finished}, {round 1, finished}, {round 2, finished}, {round 2, no}]` → `Set([1])`
  - `[]` → `Set([])`
  - `undefined` → `Set([])`
- [ ] **Step 2:** `npx -y pnpm@10 vitest run src/utils/leaderboardRounds.test.js --maxWorkers=2` → FAIL.
- [ ] **Step 3: Implementar** `getFinishedRoundNumbers` y usarlo en `RoundUserSelectors`:
  `useMatchesMeta(activeTournament?.id)` (comparte cache) → `getFinishedRoundNumbers` en un `useMemo`,
  y `getRoundLabel` muestra 🏁 si `finished.has(round.round_number)`.
- [ ] **Step 4:** el mismo comando → PASS.
- [ ] **Step 5: Commit** `fix: el 🏁 de las fechas en "Ver pronósticos" sale de los partidos`.

### Task 3: se borran los estados de fecha

**Files:**
- Delete: `src/components/RoundManager/RoundCard/` (los tres archivos)
- Rename: `src/components/RoundManager/roundStatus.ts` → `progress.ts`, y su test → `progress.test.js`
- Modify: `src/hooks/useRounds.ts`, `src/hooks/useRounds.test.jsx`, `src/types/results.ts:5`,
  `src/types/domain.ts:54-61`, `src/components/RoundManager/index.tsx`

**Interfaces:**
- Produces: `progress.ts` exporta solo `ProgressLevel`, `getProgressLevel`, `countByProgressLevel`.
- Produces: `useRounds` devuelve `{ rounds, activeRound, loading, error, fetchRounds }`.

- [ ] **Step 1:** `git mv` del archivo y su test; en `progress.ts` borrar `ROUND_STATUSES`,
  `ROUND_STATUS_ORDER`, `getRoundStatus`, `MatchCount` y `getFinishability`. Borrar sus casos en
  `progress.test.js`; los de `getProgressLevel` y `countByProgressLevel` quedan igual.
- [ ] **Step 2:** en `useRounds` borrar `updateStatusMutation`, `runStatusMutation`,
  `updateRoundStatus`, `lockRound`, `finishRound`, `openNextRound` e `isRoundOpen`. En su test, borrar
  el caso `openNextRound avisa cuando no hay fechas pendientes`.
- [ ] **Step 3:** en `RoundManager/index.tsx` borrar `matchesByRound`, `handleFinishRound`,
  `handleChangeStatus`, la lista de `RoundCard` y sus imports. Actualizar el comentario de
  `results.ts` que nombra `openNextRound` y el de `domain.ts` que nombra `roundStatus.js`.
  `RoundStatus` se queda en `domain.ts` (lo usa el tipo).
- [ ] **Step 4:** `npx -y pnpm@10 typecheck` y `lint` en verde;
  `npx -y pnpm@10 vitest run src/hooks/useRounds.test.jsx src/components/RoundManager --maxWorkers=2` → PASS.
- [ ] **Step 5: Commit** `refactor: se borran los estados de fecha del admin`.

### Task 4: Fechas es el progreso de la fecha activa

**Files:**
- Create: `src/components/Common/PageHeader/index.tsx`, `PageHeader.module.css`
- Modify: `src/components/RoundManager/index.tsx`, `ActiveRoundCard/index.tsx`,
  `RoundProgress/index.tsx` (+ css), `PlayerProgressRow/index.tsx`, `progress.ts`
- Test: `src/components/RoundManager/progress.test.js`, `RoundProgress/RoundProgress.test.jsx` (nuevo)

**Interfaces:**
- Produces: `PageHeader({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string })`:
  `<h2>` con el ícono `aria-hidden` y un `<p>` opcional. Lo usan también los PR 2 y 3.
- Produces (en `progress.ts`):
  `buildMatchLabels(matches: Pick<MatchWithTeams,'match_number'|'home_team'|'away_team'>[]): Record<number, string>`
  → `{ 2: 'Vélez Sarsfield vs Independiente' }`.
- `PlayerProgressRow` recibe `matchLabels: Record<number, string>` y muestra
  `matchLabels[n] ?? \`#${n}\`` por cada faltante.

- [ ] **Step 1: Tests que fallan.**
  - `buildMatchLabels`: dos partidos → dos entradas con `"Local vs Visitante"`; un partido con
    `home_team: null` → `"? vs Visitante"`; `[]` → `{}`.
  - `RoundProgress.test.jsx`: con 3 jugadores (100, 50, 0) renderiza los tres nombres **sin hacer
    clic**, en orden 0 → 50 → 100, y no hay botón "Ver detalles". Con un faltante `3` y
    `matchLabels={}` muestra `#3`.
- [ ] **Step 2:** correrlos → FAIL.
- [ ] **Step 3: Implementar.**
  - `RoundProgress`: sin estado `showDetails` ni botón; los tres contadores en una fila; lista
    ordenada **ascendente** por `progress`. Recibe `matchLabels`.
  - `RoundManager`: `PageHeader icon="📅" title="Fechas" subtitle="Quién ya pronosticó la fecha activa"`;
    `useMatches(activeRound?.round_number ?? null, activeTournament?.id)` →
    `buildMatchLabels` en `useMemo`. Sin `activeRound`: `EmptyState` con
    `title="No hay una fecha en juego"`.
  - `ActiveRoundCard`: nombre de la fecha y el progreso; se borra el texto "La fecha activa se
    calcula…" y la etiqueta "Fecha activa por partidas" pasa a "Fecha en juego".
- [ ] **Step 4:** los tests → PASS; `typecheck` y `lint` en verde.
- [ ] **Step 5: Verificación visual** a 360 px en `/admin/fechas` del Clausura: entra en una o dos
  pantallas, la lista se ve sin tocar nada y los faltantes dicen el cruce.
- [ ] **Step 6: Commit** `feat: Fechas muestra quién falta pronosticar, sin desplegar nada`.

### Task 5 (cierre del PR 1): documentación y PR

**Files:** `CLAUDE.md`, `docs/pendientes.md`

- [ ] **Step 1:** `CLAUDE.md`: donde dice que `rounds.status` "se actualiza a mano desde el panel de
  fechas", pasa a "ya no lo actualiza nadie: el panel de estados se borró"; nombrar
  `getFinishedRoundNumbers` junto a `leaderboardRounds.ts`. `pendientes.md`: tachar el default de
  `rounds.status` (punto 3) y agregar al punto 4 que `recalculate_round` y
  `recalculate_round_scores` escriben `round_scores` **sin `tournament_id`** y conviene borrarlas.
- [ ] **Step 2: Commit** `docs: el admin ya no maneja estados de fecha`.
- [ ] **Step 3:** pedir OK al usuario para la suite completa (`npx -y pnpm@10 test -- --maxWorkers=2`)
  y `npx -y pnpm@10 build`; con eso, push y `gh pr create` contra `main`.

---

# PR 2 — Resultados (`feat/admin-resultados`)

### Task 6: funciones puras de la pantalla de resultados

**Files:**
- Create: `src/utils/adminResults.ts`
- Test: `src/utils/adminResults.test.js`

**Interfaces:**
- Produces: `getPendingResultsRoundNumber(matchesMeta: MatchMeta[], now?: Date): number | null`:
  la fecha **más baja** con un partido `!is_finished` y `canLoadResult(match_date)`. Si no hay, la
  más alta con algún partido cargable. Si tampoco, `null`.
- Produces: `splitByResult<T extends Pick<Match,'is_finished'>>(matches: T[]): { pending: T[]; loaded: T[] }`,
  conservando el orden de entrada.

- [ ] **Step 1: Tests que fallan** (con `now` fijo y fechas relativas a él):
  - fecha 17 toda cargada + fecha 18 con un partido de hace 3 h sin cargar → `18`
  - fechas 16 y 18 con pendientes cargables → `16`
  - fecha 18 con un partido de hace 1 h (todavía no cargable, el delay es 2 h) y fecha 17 cargada → `17`
  - `[]` → `null`
  - `splitByResult` con `[a(no), b(sí), c(no)]` → `pending [a, c]`, `loaded [b]`
- [ ] **Step 2:** `npx -y pnpm@10 vitest run src/utils/adminResults.test.js --maxWorkers=2` → FAIL.
- [ ] **Step 3: Implementar** con `canLoadResult` de `utils/matchTiming` (agregarle un parámetro
  `now` opcional si hace falta para testear, sin cambiar a sus consumidores).
- [ ] **Step 4:** → PASS.
- [ ] **Step 5: Commit** `feat: funciones para elegir la fecha con resultados pendientes`.

### Task 7: el selector de penales sale solo con empate, con la regla de "Mis pronósticos"

**Files:**
- Move: `src/components/PredictionForm/MatchPrediction/QualifierPicker/` → `src/components/Common/QualifierPicker/`
  (actualizar el import de `MatchPrediction`)
- Modify: `src/components/MatchManager/MatchResult/index.tsx`
- Test: `src/components/MatchManager/MatchResult/MatchResult.test.jsx` (nuevo)

**Interfaces:**
- Consumes: `resolveQualifier` y `getQualifierToSync` de
  `PredictionForm/MatchPrediction/qualifier.ts`, con `predictionValue = resultValues[match.id]`,
  `existingPrediction = null`, `canPredict = true`.

- [ ] **Step 1: Tests que fallan** (playoff pendiente, cargable):
  - sin valores → no hay `radiogroup`
  - con `resultValues = { [id]: { home: '1', away: '1' } }` → hay `radiogroup` "Seleccionar equipo que clasifica"
  - con `{ home: '2', away: '1' }` → no hay `radiogroup`, y `onValueChange` se llamó con
    `(id, 'qualifier', home_team_id)`
- [ ] **Step 2:** correrlos → FAIL.
- [ ] **Step 3:** en `MatchResult`, reemplazar `selectedQualifierTeamId`, `qualifierIsLocked`, el
  efecto de sincronización y el bloque de radios por `resolveQualifier` + un efecto que aplica
  `getQualifierToSync` + `<QualifierPicker>` solo si `shouldShowPicker`. Se borra el texto
  "No hace falta elegir…". El guardado de `MatchManager` no cambia.
- [ ] **Step 4:** → PASS; los tests de `MatchPrediction` siguen en verde.
- [ ] **Step 5: Commit** `feat: cargar resultados usa el mismo selector de penales que los pronósticos`.

### Task 8: Resultados abre en la fecha pendiente, con los cargados compactos

**Files:**
- Create: `src/components/MatchManager/LoadedResultRow/index.tsx` (+ `.module.css`)
- Modify: `src/components/MatchManager/index.tsx`
- Test: `src/components/MatchManager/LoadedResultRow/LoadedResultRow.test.jsx`

**Interfaces:**
- Consumes: `getPendingResultsRoundNumber`, `splitByResult` (Task 6); `PageHeader` (Task 4).
- Produces: `LoadedResultRow({ match }: { match: MatchWithTeams })`: una línea
  `"Local 2 - 2 Visitante"` y, si es playoff con empate, `"· pasa Local"` (de `qualifier_team`).

- [ ] **Step 1: Tests que fallan** de `LoadedResultRow`: Vélez 2-2 Belgrano playoff con
  `qualifier_team` Vélez → texto con `2 - 2` y `pasa Vélez Sarsfield`; River 3-1 Lanús → sin "pasa".
- [ ] **Step 2:** → FAIL.
- [ ] **Step 3: Implementar.**
  - `MatchManager`: `PageHeader icon="⚙️" title="Resultados"`. Si `selectedRound` es `null` y hay
    `matchesMeta`, se setea `getPendingResultsRoundNumber(matchesMeta)` una vez (no pisa la
    elección manual). Se borra el bloque "Seleccioná una fecha".
  - Lista: `pending` con `MatchResult`; si hay `loaded`, un título "Ya cargados (n)" y un
    `LoadedResultRow` por partido. Sin pendientes: "Todos los resultados de esta fecha están
    cargados" arriba de la lista.
  - El botón de guardar solo se muestra si hay pendientes.
- [ ] **Step 4:** → PASS; `typecheck`, `lint`.
- [ ] **Step 5: Verificación visual** a 360 px: `/admin/partidos` abre sola en Octavos (todo
  cargado) o en Cuartos cuando haya pasado el delay; los cargados ocupan una línea cada uno; con
  1-1 en un cuarto aparece el selector. **No guardar resultados reales**: probar el guardado en
  `test-sandbox`.
- [ ] **Step 6: Commit** `feat: Resultados abre en la fecha pendiente y compacta lo cargado`.
- [ ] **Step 7:** OK del usuario para suite completa + build, push y PR.

---

# PR 3 — Horarios (`feat/admin-horarios`)

### Task 9: Horarios abre en la fecha activa y muestra la hora una sola vez

**Files:**
- Modify: `src/components/AdminMatchSchedule/index.tsx` (+ crear `AdminMatchSchedule.module.css`)
- Create: `src/components/AdminMatchSchedule/schedule.ts`
- Test: `src/components/AdminMatchSchedule/schedule.test.js`

**Interfaces:**
- Consumes: `activeRound` de `useRounds`; `PageHeader` (Task 4).
- Produces: `getPreviousTime(originalIso: string | null, editedLocal: string): string | null`.
  Devuelve `"20:00"` (con `formatMatchTime`) si `editedLocal` es distinto del original pasado por
  `toDatetimeLocalValue`, y `null` si es igual o si `editedLocal` está vacío. `toDatetimeLocalValue`
  y `toUtcIso` se mudan a `schedule.ts`.

- [ ] **Step 1: Tests que fallan:** original `2026-11-28T23:00:00Z` y editado igual → `null`;
  editado a otra hora → la hora original formateada; editado `''` → `null`.
- [ ] **Step 2:** → FAIL.
- [ ] **Step 3: Implementar.**
  - Fecha inicial: `activeRound?.round_number`, y si no hay, la fecha más alta con partidos (hoy
    elige `rounds[0]`, la Fecha 1).
  - Cada partido: equipos y el `DateTimeInput`; se borra el bloque "Horario actual". Debajo del
    input, `antes: {getPreviousTime(...)}` cuando no es `null`.
  - `PageHeader icon="🕒" title="Horarios"`. Botón de guardar `position: sticky; bottom` como en
    Resultados.
  - Estilos inline del archivo → `AdminMatchSchedule.module.css`.
- [ ] **Step 4:** → PASS; `typecheck`, `lint`.
- [ ] **Step 5: Verificación visual** a 360 px: abre en Cuartos, una hora por partido; cambiar una
  hora muestra "antes: 20:00" y volverla a la original lo saca. **No guardar.**
- [ ] **Step 6: Commit** `feat: Horarios abre en la fecha en juego y muestra cada hora una vez`.
- [ ] **Step 7:** OK del usuario para suite completa + build, push y PR. Al mergear, borrar
  `docs/diseno-admin.md` y este plan, y sacar el punto 3 de `pendientes.md`.
