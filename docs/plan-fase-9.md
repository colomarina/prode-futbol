# Plan de la fase 9 — migraciones, con verificación por migración

Este documento es el plan de ejecución de la fase 9. El diagnóstico está en
`docs/pruebas-fase-9.md`; acá va **qué SQL aplicar, en qué orden, y cómo se verifica
cada uno**.

## El flujo acordado

Ninguna migración la puede aplicar el asistente: hacen falta credenciales admin de la
base (`service_role` o el panel de Supabase). El flujo es:

1. El asistente escribe la migración (SQL + rollback) y **cómo la va a verificar**.
2. **Vos la aplicás** (panel o CLI con `service_role`).
3. El asistente la **verifica en el acto** y te dice si quedó bien, mal o a medias.
4. Si quedó mal, aplicás el rollback (que está al lado) y ajustamos.

**No hay entorno de staging**: la base es la de producción. Por eso el orden es de
menor a mayor riesgo, y las irreversibles van con un prerequisito de revisar
dependencias primero.

## Cómo se verifica cada cosa (y sus límites)

Hay **dos capas** de verificación, y sirven para cosas distintas:

- **Capa de datos — `curl` con un JWT** (el asistente saca el token de `test-colo` por
  la API de auth). Prueba la policy **por debajo de la UI**, o sea exactamente lo que
  puede hacer un atacante con un `fetch`. Es la verificación _precisa_ de una policy.
  No necesita que nadie se loguee.
- **Capa de app — Playwright**. Prueba que la app real **no se rompió**: que el admin
  sigue pudiendo cargar un resultado, que un usuario sigue pudiendo pronosticar. Es
  verificación de _regresión_, y necesita que **vos loguees la sesión admin** (como en
  las fases 6 y 7).

**Un límite honesto que hay que tener presente:** las migraciones de limpieza (los
`DROP`, los índices) **no tienen comportamiento observable** — el punto es justamente
que nada las usa. Ahí "verificar" solo puede significar "la app sigue andando igual"
(regresión). Si un consumidor **externo** a la app —un reporte, un dashboard, un
script— usa una vista o columna que borramos, no me voy a enterar. Por eso esas van
después de que vos mires las dependencias en el panel.

## Dos prerequisitos que solo podés dar vos

1. **Un torneo de prueba `finished`.** Hoy los cinco torneos son: 2 de prueba (los dos
   `active`), Clausura (`active`), y Apertura + Mundial (`finished`, pero son reales).
   Para probar "la policy rechaza escribir en un torneo finalizado" sin ensuciar datos
   reales, hace falta un torneo `test-*` en `finished`. Lo más simple: poné
   `test-vacio` en `finished` un rato (no tiene partidos, así que no molesta), o creá
   `test-finished`. Avisame cuál y con eso pruebo.
2. **Mirar los triggers/funciones antes de cada `DROP`.** El esquema generado no
   muestra triggers ni cuerpos de función, así que borrar `matches.status` o una vista
   sería a ciegas. Antes de la entrega B, abrí el panel (o corré el `\d+` / la query a
   `pg_depend` que dejo en cada migración) y confirmá que nada las referencia.

---

# Entrega A — Seguridad (urgente, bajo riesgo, verificable casi entera por el asistente)

> **Estado: A1 y A2 aplicadas y verificadas el 2026-08-20.** Con eso la fase 9 está
> resuelta en lo que importa (la vulnerabilidad y el agujero de `isReadOnly`). Lo que
> queda —A3 y la entrega B— es limpieza sin urgencia. El SQL exacto que se aplicó está
> abajo en cada sección; regresión de RLS confirmada (matches/rounds siguen rechazando
> a un no-admin, pronósticos ajenos dan 42501, la lectura sigue pública).

## A1 — 🔴 `profiles`: bloquear el cambio de `role` ✅ APLICADA

**Arregla** la escalada de privilegios: hoy un usuario común se hace admin con
`PATCH /profiles { role: 'admin' }`.

**Diagnóstico**: la policy de UPDATE de `profiles` tenía `with_check: null` y
`qual: (auth.uid() = id)`. Eso protege el `id` (Postgres reusa el `USING` como
`WITH CHECK`) pero **no** las columnas: el dueño podía cambiar cualquiera, incluida
`role`.

**SQL aplicado** — un trigger `BEFORE UPDATE`, no un cambio de policy. RLS no filtra
por columna; el trigger sí, y de forma quirúrgica. El guard `auth.uid() IS NOT NULL`
hace que no interfiera desde el panel (ahí `auth.uid()` es null), así que los roles se
siguen gestionando desde la base.

```sql
create or replace function public.prevent_profile_role_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is not null and new.role is distinct from old.role then
    new.role := old.role;
  end if;
  return new;
end;
$$;

create trigger trg_prevent_profile_role_change
  before update on public.profiles
  for each row
  execute function public.prevent_profile_role_change();
```

Revert silencioso (`new.role := old.role`) y no `raise`: un atacante ve un `200` con
el rol intacto, sin la confirmación de que hay una defensa.

**Rollback:**

```sql
drop trigger if exists trg_prevent_profile_role_change on public.profiles;
drop function if exists public.prevent_profile_role_change();
```

**Resultado de la verificación** (con `test-colo`): `PATCH role=admin` → quedó en
`user`; lectura independiente → `user`; `PATCH full_name` → sigue funcionando. ✅

**Riesgo:** bajo. Es _más_ restrictiva; el cliente solo edita `username`/`full_name`
(`AuthContext.updateProfile`), así que a un usuario normal no le cambia nada.

**Verificación — la hago yo solo con `test-colo`, no necesitás loguearte:**

1. Reintento `PATCH role=admin` sobre test-colo → **debe fallar o quedar en `user`**.
2. `PATCH full_name` sobre test-colo → **debe seguir funcionando** (que no cerró de
   más). Lo dejo en "Test Colo".
3. Leo el `role` con una query independiente para confirmar que quedó en `user`.

---

## A2 — `predictions`: rechazar escrituras en torneos no `active` ✅ APLICADA

**Arregla** que `isReadOnly` sea solo UI: hoy se puede escribir un pronóstico en un
torneo `finished`.

**SQL aplicado** — policies `RESTRICTIVE` (se combinan con AND con las existentes, sin
tocarlas; el SELECT sigue público porque van solo en INSERT y UPDATE):

```sql
create policy "predictions_insert_torneo_activo"
  on public.predictions
  as restrictive
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.matches m
      join public.tournaments t on t.id = m.tournament_id
      where m.id = predictions.match_id and t.status = 'active'
    )
  );

create policy "predictions_update_torneo_activo"
  on public.predictions
  as restrictive
  for update
  to authenticated
  using (
    exists (
      select 1 from public.matches m
      join public.tournaments t on t.id = m.tournament_id
      where m.id = predictions.match_id and t.status = 'active'
    )
  )
  with check (
    exists (
      select 1 from public.matches m
      join public.tournaments t on t.id = m.tournament_id
      where m.id = predictions.match_id and t.status = 'active'
    )
  );
```

**Rollback:**

```sql
drop policy if exists "predictions_insert_torneo_activo" on public.predictions;
drop policy if exists "predictions_update_torneo_activo" on public.predictions;
```

**Resultado de la verificación** (con `test-colo`, sobre el Mundial finished y el
sandbox active): UPDATE en el Mundial → 0 filas; INSERT en el Mundial → `42501`;
UPDATE e INSERT en el sandbox → funcionan. Regresión: matches/rounds siguen rechazando
a un no-admin y los pronósticos ajenos dan `42501`. ✅

**Alcance**: bloquea por estado del torneo, no por el cutoff del partido. En un torneo
activo se puede seguir editando aunque el partido ya se jugó — eso es A3.

**Riesgo:** medio. Si queda mal, **bloquea pronósticos legítimos** en torneos activos.
Por eso el chequeo #2 de abajo (que en `active` sigue andando) es el crítico, no el #1.

**Verificación — con `test-colo` (yo), pero necesito el prerequisito #1:**

1. Escribir un pronóstico en el torneo de prueba `finished` → **debe rechazar**.
2. Escribir un pronóstico en `test-sandbox` (`active`, partido futuro) → **debe seguir
   andando**. Este es el que importa: si falla, la policy cerró de más.
3. **Playwright con tu sesión admin** (refuerzo): entrar a `/pronosticos` en un torneo
   activo y guardar, para confirmar el flujo batch real. Baseline: ya lo probamos en
   la fase 6.

---

## A3 — cutoff de pronósticos en la base _(opcional — evaluar si vale el riesgo)_

**Arregla** que el cierre de 10 minutos sea solo del cliente. La pieza candidata es
`can_predict(match_id)`, que **hoy está rota** (`search_path` sin setear).

**Por qué la marco opcional:** el cutoff en el cliente (`PredictionForm` filtra con
`canPredictMatch` al guardar) ya funciona y está verificado. Ponerlo en la base es
defensa en profundidad, pero **el guardado es un batch**: si la policy rechaza una fila
vencida, hay que definir si cae el batch entero o solo esa fila, y eso puede romper el
flujo real de guardado. Alto riesgo para un agujero que hoy solo explota si alguien
usa la API a mano.

**Sugerencia:** dejarla para el final, o directamente para después de la fase, y
primero solo **arreglar `can_predict`** (`set search_path = public`) sin cablearla,
que no cambia nada y deja la pieza lista.

**Verificación (si se hace):** con `test-colo` en `test-sandbox`, un partido futuro
permite y uno ya empezado rechaza; y Playwright del guardado batch real, contra el
baseline de la fase 6.

---

# Entrega B — Limpieza de esquema (irreversible, necesita revisar el panel primero)

Estas **no tienen verificación de comportamiento**: la verificación es regresión (la
app sigue igual) más lo que vos confirmes en el panel. Van después de A.

## B1 — `matches.tournament_id` y `rounds.tournament_id` → `NOT NULL`

Cero filas null hoy (verificado), así que el `ALTER` no falla por datos.

```sql
alter table public.matches alter column tournament_id set not null;
alter table public.rounds  alter column tournament_id set not null;
```

**Rollback:** `... drop not null;` (trivial).
**Riesgo:** bajo. **Verificación:** regresión — la app sigue cargando torneos, fechas y
partidos. Playwright sobre las pantallas principales.

## B2 — borrar `matches.status` (columna muerta)

**Prerequisito:** confirmar en el panel que ningún trigger/función/vista la referencia
(`select … from pg_depend`, o buscar `status` en los cuerpos de función). El cliente no
la lee (verificado: `MatchStatusBadge` deriva de `match_date` + `is_finished`).

```sql
alter table public.matches drop column status;
```

**Rollback:** re-agregar la columna con su CHECK y default (guardá la definición).
**Riesgo:** alto si algo no visto la usa; nulo para la app. **Verificación:** regenerar
`database.ts` (`pnpm types:db`), que `pnpm typecheck` siga en verde, y regresión.

## B3 — las 3 vistas de más y la superficie muerta de pagos

Hay 4 vistas y el cliente usa 1 (`general_leaderboard`, en una rama casi inalcanzable).
Y 4 tablas + 15 funciones de pagos sin un solo consumidor desde la fase 1.

**Esto es lo más delicado y lo dejaría para lo último**, o para una fase de limpieza de
base aparte. Un `DROP` de tablas/funciones es lo que más puede romper si hay
dependencias externas. Prerequisito fuerte: revisar `pg_depend` de cada una.

**Verificación:** solo regresión + typecheck. Acá el asistente **no puede garantizar**
que no rompa algo externo a la app; esa parte la tenés que evaluar vos.

## B4 — índices

```sql
create index if not exists idx_matches_torneo_fecha
  on public.matches (tournament_id, round_number);
create index if not exists idx_round_scores_torneo_fecha
  on public.round_scores (tournament_id, round_number);
```

**Rollback:** `drop index …`.
**Riesgo:** nulo (agregar índice no rompe). **Verificación:** ninguna funcional; a lo
sumo medir que una consulta pesada mejore. Se puede dejar para cuando haya volumen.

---

## Orden sugerido

1. **A1** (seguridad, la urgente) — verificable ya, sin prerequisitos.
2. **A2** — cuando tengas el torneo de prueba `finished`.
3. **B1** y **B4** — bajos y reversibles, cuando quieras.
4. **A3, B2, B3** — evaluar; necesitan decisión (A3) o revisar dependencias (B2, B3).

La fase 9 se puede dar por "hecha" con **A1 + A2** aplicadas y verificadas: eso cierra
la vulnerabilidad y el agujero de `isReadOnly`, que es lo que de verdad importa. El
resto es limpieza que puede ir a su propio ritmo.
