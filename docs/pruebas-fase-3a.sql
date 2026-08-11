-- Seed de datos para las pruebas de la fase 3a (docs/pruebas-fase-3a.md).
-- Descartable: se borra junto con el checklist una vez mergeada la rama.
--
-- Correr los bloques en orden en el SQL editor de Supabase.
-- El bloque 0 es diagnóstico (no escribe nada) y el 6 es el limpiador.
--
-- Todo está scopeado a torneos con slug `test-`, que solo ven los admins
-- (src/utils/tournamentAccess.js). Nada de esto toca un torneo real.


-- ============================================================================
-- 0. DIAGNÓSTICO — correr primero, no escribe nada
-- ============================================================================

-- 0.1 Qué torneos hay (para saber con cuál comparar en el test de multi-torneo)
select id, slug, name, status, type
from tournaments
order by status, slug;

-- 0.2 Cuántos equipos hay: el bloque 3 necesita al menos 12
select count(*) as total_teams from teams;

-- 0.3 Tipo de las columnas de fecha.
--     Si `matches.match_date` es `timestamp without time zone` (naive), los
--     `now() + interval` de abajo quedan corridos por el offset de zona:
--     en ese caso reemplazar `now()` por
--     `(now() at time zone 'America/Argentina/Buenos_Aires')` en todo el script.
select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in ('tournaments', 'rounds', 'matches')
order by table_name, ordinal_position;

-- 0.4 Cuentas admin / no admin disponibles (el checklist 7 necesita una de cada)
select p.id, p.username, p.full_name, p.role, u.email
from profiles p
join auth.users u on u.id = p.id
order by p.role, p.username;

-- 0.5 Cuerpo de las funciones que importan.
--     `update_prediction_points` es lo único que puede contaminar datos reales
--     desde el torneo de prueba (si no filtra por tournament_id).
--     Las dos `validate_*` de rounds condicionan qué estados puede tener el seed.
--     (La versión que barría todo pg_proc rompía: pg_get_functiondef falla sobre
--     las funciones de agregado que instalan las extensiones.)
select p.proname, pg_get_functiondef(p.oid) as definicion
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prokind = 'f'
  and p.proname in (
    'update_prediction_points',
    'validate_round_status_transition',
    'validate_single_open_round',
    'is_admin'
  );

-- 0.5b Slugs con espacios o saltos de línea invisibles.
--      Ojo: btrim(slug) sin segundo argumento saca espacios pero NO \n, así que
--      hay que pasarle el set de caracteres. Comparar `largo` con lo que se ve.
select id,
       slug,
       length(slug) as largo,
       slug <> btrim(slug, E' \t\r\n') as tiene_basura
from tournaments
order by slug;

-- 0.5c ¿Qué fechas están abiertas hoy, en toda la base?
--      Importa por el bug de `validate_single_open_round` (ver bloque 1.c).
select t.slug, r.round_number, r.status
from rounds r
join tournaments t on t.id = r.tournament_id
where r.status = 'open'
order by t.slug, r.round_number;

select c.relname as tabla,
       t.tgname  as trigger,
       pg_get_triggerdef(t.oid) as definicion
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
where not t.tgisinternal
  and c.relnamespace = 'public'::regnamespace
order by c.relname, t.tgname;

-- 0.6 RLS (para el checklist con cuenta no admin)
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;


-- ============================================================================
-- 1. Torneo principal de prueba
-- ============================================================================

-- 1.a El torneo ya existía creado a mano, pero con un salto de línea al final del
--     slug ('test-sandbox\n'). Hay que limpiarlo ANTES de cualquier otro bloque:
--     todo lo que sigue busca el torneo por `slug = 'test-sandbox'` y no matchea.
--     El prefijo test- se detecta igual (startsWith), así que la visibilidad no
--     estaba rota, pero un slug con basura no matchea la config de temas ni
--     ningún chequeo por igualdad.
update tournaments
set slug = btrim(slug, E' \t\r\n')
where slug <> btrim(slug, E' \t\r\n');

-- 1.b Recién ahora el upsert por slug es confiable.
insert into tournaments (slug, name, season, type, status)
values ('test-sandbox', 'Sandbox de pruebas', '2026', 'league', 'active')
on conflict (slug) do update
  set status = 'active',
      name = excluded.name
returning id, slug, status;


-- ============================================================================
-- 1.c Bug del trigger de "una sola fecha abierta" — CORRER ANTES DEL BLOQUE 2
-- ============================================================================
-- `validate_single_open_round` cuenta las fechas abiertas de TODA la base, sin
-- filtrar por tournament_id:
--
--     SELECT COUNT(*) FROM public.rounds WHERE status = 'open' AND id != NEW.id;
--
-- Es el mismo bug de scope que CLAUDE.md prohíbe del lado del cliente. Efectos:
--   * con una fecha abierta en clausura-2026, no se puede abrir ninguna del
--     torneo de prueba (rompe el punto 5 del checklist sin que sea culpa del refactor)
--   * al revés es peor: el trigger es BEFORE UPDATE, así que el seed puede
--     INSERTAR una fecha 'open' y a partir de ahí el torneo real no puede abrir
--     su próxima fecha. El guard del front no lo explica porque solo mira las
--     fechas del torneo activo (RoundManager:201).
--
-- Por eso el bloque 2 no deja ninguna fecha en 'open': abrir la fecha 3 desde
-- Admin → Fechas ES la prueba del punto 5, y necesita este fix.
--
-- `is not distinct from` y no `=`: rounds.tournament_id es nullable.

create or replace function public.validate_single_open_round()
returns trigger
language plpgsql
set search_path to 'public, extensions'
as $function$
declare
  open_count integer;
begin
  if new.status = 'open' then
    -- Una sola fecha abierta POR TORNEO: los round_number y los estados se
    -- repiten entre torneos, contarlos sin scope mezcla torneos distintos.
    select count(*) into open_count
    from public.rounds
    where status = 'open'
      and id != new.id
      and tournament_id is not distinct from new.tournament_id;

    if open_count > 0 then
      raise exception 'Ya existe una fecha abierta en este torneo. Cerrá o bloqueá la fecha actual antes de abrir otra.';
    end if;
  end if;

  return new;
end;
$function$;


-- ============================================================================
-- 2. Fechas
-- ============================================================================
-- `status` va explícito siempre: el default de rounds.status es 'closed', que no
-- está en su propio CHECK (ver docs/supabase-schema.md), así que un INSERT sin
-- status falla.
--
-- Numeración: se evitan a propósito las fechas 4, 5, 18, 19 y 20. LeadboardHeader
-- las filtra del selector de la tabla de posiciones (4 y 5 son "tablas aparte" del
-- mundial, 17-20 se agrupan en la solapa Playoffs). La fecha "normal" del
-- escenario 4 del checklist es acá la 6, y los playoffs son la 17.
--
-- Ninguna fecha se inserta en 'open', por el bug del bloque 1.c: una fecha
-- abierta acá le bloquea al torneo real la apertura de su próxima fecha. Abrir la
-- fecha 3 desde Admin → Fechas es justamente la prueba del punto 5 del checklist.
--
-- Nada de esto bloquea pronosticar: `canPredictRound` está exportado pero ningún
-- componente lo usa, el gate real es por tiempo (`canPredictMatch`).
--
-- 1, 2, 3 y 6 quedan en estados que el selector de la tabla de posiciones muestra
-- (filtra open/locked/finished). La 17 va 'pending' para dejar algo que probar con
-- "abrir siguiente fecha", y de paso los playoffs se agrupan aparte en ese selector.

with tid as (select id from tournaments where slug = 'test-sandbox')
insert into rounds (tournament_id, round_number, name, status, opens_at, closes_at)
select tid.id, v.round_number, v.name, v.status, v.opens_at, v.closes_at
from tid
cross join (values
  (1,  'Fecha 1 (cerrada, con resultados)', 'finished', now() - interval '10 days', now() - interval '5 hours'),
  (2,  'Fecha 2 (en juego)',                'locked',   now() - interval '9 days',  now() - interval '1 hour'),
  (3,  'Fecha 3 (mixta)',                   'locked',   now() - interval '2 days',  now() + interval '40 minutes'),
  (6,  'Fecha 6 (normal)',                  'locked',   now() - interval '1 day',   now() + interval '3 days'),
  (17, 'Cuartos de final',                  'pending',  now() - interval '1 day',   now() + interval '5 days')
) as v(round_number, name, status, opens_at, closes_at)
on conflict do nothing;


-- ============================================================================
-- 3. Partidos
-- ============================================================================
-- Los equipos se eligen por posición alfabética (1..12) para no depender de
-- nombres puntuales: `teams` es global y no tiene tournament_id.
--
-- Escenarios cubiertos:
--   Fecha 1  → hace 5 h, terminados con resultado → SÍ aparece en Cargar Resultados
--   Fecha 2  → hace 1 h, sin resultado            → NO aparece (< 2 h)
--   Fecha 3  → uno en 5 min (bloqueado por el cutoff de 10 min) y uno en 40 min (abierto)
--   Fecha 6  → en 3 días, caso normal
--   Fecha 17 → bracket de playoffs: cuartos (2 jugados + 2 por jugar), semis y final.
--              El primer partido de cuartos quedó 1-1 con clasificado cargado,
--              que es lo que dispara la columna de clasificado en el bracket.

with tid as (select id from tournaments where slug = 'test-sandbox'),
     eq as (select id, row_number() over (order by name) as n from teams)
insert into matches (
  tournament_id, round_number, match_number, match_date,
  home_team_id, away_team_id,
  home_score, away_score, is_finished, status,
  is_playoff, playoff_stage, qualifier_team_id
)
select tid.id, v.round_number, v.match_number, v.match_date,
       h.id, a.id,
       v.home_score, v.away_score, v.is_finished, v.status,
       v.is_playoff, v.playoff_stage, q.id
from tid
cross join (values
  -- round, nro, fecha,                              local, visita, gol_l,     gol_v,     terminado, status,       playoff, etapa,             clasificado
  (1,  1, now() - interval '5 hours',                 1,  2, 2::int,    1::int,    true,  'finished', false, null::text,   null::int),
  (1,  2, now() - interval '5 hours' + interval '2 hours', 3,  4, 0,    0,         true,  'finished', false, null,         null),
  (2,  1, now() - interval '1 hour',                  5,  6, null,      null,      false, 'open',     false, null,         null),
  (2,  2, now() - interval '1 hour' + interval '30 minutes', 7, 8, null, null,     false, 'open',     false, null,         null),
  (3,  1, now() + interval '5 minutes',               9, 10, null,      null,      false, 'open',     false, null,         null),
  (3,  2, now() + interval '40 minutes',             11, 12, null,      null,      false, 'open',     false, null,         null),
  (6,  1, now() + interval '3 days',                  1,  3, null,      null,      false, 'pending',  false, null,         null),
  (6,  2, now() + interval '3 days' + interval '2 hours',  2,  4, null, null,      false, 'pending',  false, null,         null),
  (6,  3, now() + interval '3 days' + interval '4 hours',  5,  7, null, null,      false, 'pending',  false, null,         null),
  (17, 1, now() - interval '5 hours',                  1,  2, 1,        1,         true,  'finished', true,  'cuartos',    1),
  (17, 2, now() - interval '5 hours' + interval '2 hours', 3, 4, 3,     1,         true,  'finished', true,  'cuartos',    null),
  (17, 3, now() + interval '3 days',                   5,  6, null,     null,      false, 'pending',  true,  'cuartos',    null),
  (17, 4, now() + interval '3 days' + interval '2 hours',  7,  8, null, null,      false, 'pending',  true,  'cuartos',    null),
  (17, 5, now() + interval '4 days',                   1,  3, null,     null,      false, 'pending',  true,  'semifinal',  null),
  (17, 6, now() + interval '4 days' + interval '2 hours',  5,  7, null, null,      false, 'pending',  true,  'semifinal',  null),
  (17, 7, now() + interval '5 days',                   1,  5, null,     null,      false, 'pending',  true,  'final',      null)
) as v(round_number, match_number, match_date, home_n, away_n,
       home_score, away_score, is_finished, status, is_playoff, playoff_stage, qualifier_n)
join eq h on h.n = v.home_n
join eq a on a.n = v.away_n
left join eq q on q.n = v.qualifier_n
-- Mismo guard que en el bloque 4: sin unique sobre
-- (tournament_id, round_number, match_number) no hay `on conflict` posible, y
-- volver a correr este bloque duplicaria los 16 partidos.
where not exists (
  select 1 from matches ya
  where ya.tournament_id = tid.id
    and ya.round_number = v.round_number
    and ya.match_number = v.match_number
);


-- ============================================================================
-- 3.c Un partido cargable y todavía sin resultado
-- ============================================================================
-- El bloque 3 deja los partidos cargables (fecha 1 y los dos cuartos jugados) ya
-- terminados, así que no hay dónde probar "cargar un resultado" ni el contador que
-- sube solo. Este partido llena ese hueco: hace 3 h (cargable, porque el delay es
-- de 2 h) y sin resultado.
--
-- Va en la fecha 6 y no en la 1: en Admin → Fechas el contador se muestra dentro
-- del botón "Finalizar (x/y)", y una fecha `finished` como la 1 no tiene ese botón.
-- La 6 está `locked`, así que muestra "Finalizar (0/4)" y al cargar el resultado
-- tiene que pasar a (1/4) sin recargar la página.
--
-- Efecto lateral buscado: la fecha 6 también empieza a aparecer en Cargar
-- Resultados. Es correcto, ningún casillero dice lo contrario para esa fecha.

-- Limpia la versión anterior de este partido (iba en la fecha 1) si ya se corrió.
delete from matches
where tournament_id = (select id from tournaments where slug = 'test-sandbox')
  and round_number = 1
  and match_number = 3;

with tid as (select id from tournaments where slug = 'test-sandbox'),
     eq as (select id, row_number() over (order by name) as n from teams)
insert into matches (
  tournament_id, round_number, match_number, match_date,
  home_team_id, away_team_id, is_finished, status, is_playoff
)
select tid.id, 6, 4, now() - interval '3 hours', h.id, a.id, false, 'open', false
from tid
cross join eq h
cross join eq a
where h.n = 5 and a.n = 9;


-- ============================================================================
-- 3.d Re-armar el partido cargable, para volver a probar la carga de resultado
-- ============================================================================
-- Una vez cargado el resultado, el partido queda `is_finished` y sus inputs
-- deshabilitados ("Resultado guardado"), así que la prueba no se puede repetir.
-- Esto lo devuelve al estado anterior. Sirve cada vez que haya que reprobar la
-- sección 6, incluido el contador que tiene que subir sin recargar la página.
--
-- El UPDATE dispara `update_prediction_points`, pero con is_finished en false la
-- función no entra a su cuerpo: no recalcula nada.

update matches
set is_finished = false,
    home_score = null,
    away_score = null,
    status = 'open',
    match_date = now() - interval '3 hours'
where tournament_id = (select id from tournaments where slug = 'test-sandbox')
  and round_number = 6
  and match_number = 4;


-- ============================================================================
-- 3.b Re-sellar los tiempos — correr justo antes de probar las secciones 2 y 6
-- ============================================================================
-- Los escenarios de tiempo se vencen solos:
--   * la fecha 3 vale ~30 min: pasados los 40 min, el segundo partido también
--     cruza el cutoff y los dos quedan cerrados
--   * la fecha 2 vale ~1 h: cuando sus partidos cumplen 2 h, la fecha empieza a
--     aparecer en Cargar Resultados y se rompe el primer casillero de la sección 6
--
-- Esto los vuelve a poner en hora sin recrear nada. Es seguro: el trigger
-- `update_points_on_match_result` solo hace algo si `is_finished` es true con
-- resultado cargado, y estos partidos no lo están.

update matches
set match_date = now() - interval '1 hour' + (match_number - 1) * interval '30 minutes'
where round_number = 2
  and tournament_id = (select id from tournaments where slug = 'test-sandbox');

update matches
set match_date = case match_number
                   when 1 then now() + interval '5 minutes'
                   else now() + interval '40 minutes'
                 end
where round_number = 3
  and tournament_id = (select id from tournaments where slug = 'test-sandbox');


-- ============================================================================
-- 4. Segundo torneo de prueba: recién creado, sin nada para cargar
-- ============================================================================
-- Sirve para dos casilleros del checklist:
--   * el cartel 🕒 "Todavía no hay fechas para cargar" en Admin → Resultados
--     (en test-sandbox ese cartel NO va a aparecer, porque la fecha 1 ya es cargable)
--   * cambiar de torneo sin tocar uno real

insert into tournaments (slug, name, season, type, status)
values ('test-vacio', 'Sandbox vacío', '2026', 'league', 'active')
on conflict (slug) do update set status = 'active'
returning id, slug;

-- 'locked' y no 'open', por el bug del bloque 1.c: mientras exista una fecha
-- abierta acá, el trigger le impide al torneo real abrir su próxima fecha.
-- Ningún casillero del checklist depende del status de esta fecha.
with tid as (select id from tournaments where slug = 'test-vacio')
insert into rounds (tournament_id, round_number, name, status, opens_at, closes_at)
select tid.id, 1, 'Fecha 1', 'locked', now(), now() + interval '3 days'
from tid
on conflict do nothing;

-- 4.b Reparación: la primera versión de este bloque insertaba la fecha en 'open'.
--     Correr si ya se ejecutó esa versión (la verificación del bloque 5 lo muestra
--     como `estado_fecha: open` para test-vacio).
update rounds
set status = 'locked'
where status = 'open'
  and tournament_id in (select id from tournaments where slug like 'test-%');

with tid as (select id from tournaments where slug = 'test-vacio'),
     eq as (select id, row_number() over (order by name) as n from teams)
insert into matches (
  tournament_id, round_number, match_number, match_date,
  home_team_id, away_team_id, is_finished, status, is_playoff
)
select tid.id, 1, v.match_number, v.match_date, h.id, a.id, false, 'pending', false
from tid
cross join (values
  (1, now() + interval '3 days', 1, 2),
  (2, now() + interval '3 days' + interval '2 hours', 3, 4)
) as v(match_number, match_date, home_n, away_n)
join eq h on h.n = v.home_n
join eq a on a.n = v.away_n
-- Sin este guard el bloque no es idempotente: `matches` no tiene unique sobre
-- (tournament_id, round_number, match_number), asi que no hay `on conflict` que
-- lo frene y cada corrida duplica los partidos. Paso de verdad: correrlo tres
-- veces dejo 6 partidos en la fecha 1 y volvio inservible el torneo vacio.
where not exists (
  select 1 from matches ya
  where ya.tournament_id = tid.id
    and ya.round_number = 1
    and ya.match_number = v.match_number
);


-- ============================================================================
-- 5. Verificación: qué estado debería mostrar la UI
-- ============================================================================
-- Reproduce en SQL las reglas de src/utils/matchTiming.js
-- (PREDICTION_CUTOFF_MINUTES = 10, RESULT_LOAD_DELAY_HOURS = 2).

select t.slug,
       m.round_number,
       r.status as estado_fecha,
       m.match_number,
       m.match_date,
       m.match_date - interval '10 minutes' > now() as se_puede_pronosticar,
       now() >= m.match_date + interval '2 hours'    as admin_puede_cargar,
       m.is_finished,
       m.is_playoff,
       m.playoff_stage,
       m.qualifier_team_id is not null as tiene_clasificado
from matches m
join tournaments t on t.id = m.tournament_id
left join rounds r on r.tournament_id = m.tournament_id and r.round_number = m.round_number
where t.slug like 'test-%'
order by t.slug, m.round_number, m.match_number;


-- ============================================================================
-- 5b. OPCIONAL — puntos de prueba para la tabla de posiciones
-- ============================================================================
-- Seguro: el diagnóstico 0.5 confirmó que `update_prediction_points` arma
-- round_scores con el tournament_id del partido, así que los puntos del sandbox
-- no se mezclan con la tabla real.
--
-- Sirve para tener algo que mirar en Tabla de Posiciones sin cargar pronósticos a
-- mano. La fecha 17 es la que alimenta la solapa "🥊 Playoffs".
-- El `on conflict` usa el unique que confirma esa misma función.

with tid as (select id from tournaments where slug = 'test-sandbox'),
     jugadores as (
       select id, row_number() over (order by username) as n
       from profiles
     )
insert into round_scores (tournament_id, user_id, round_number, total_points)
select tid.id, j.id, v.round_number, v.total_points
from tid
cross join (values
  (1, 1, 12), (1, 2, 9), (1, 3, 5),
  (2, 1, 7),  (2, 2, 11), (2, 3, 8),
  (17, 1, 9), (17, 2, 4), (17, 3, 6)
) as v(round_number, jugador_n, total_points)
join jugadores j on j.n = v.jugador_n
on conflict (user_id, tournament_id, round_number)
do update set total_points = excluded.total_points;


-- ============================================================================
-- 5c. OPCIONAL — pronóstico en el cuarto de final ya cerrado
-- ============================================================================
-- El ✅/❌ del clasificado (Playoffs/PlayoffMatch/index.jsx:99 y :135) solo se
-- dibuja sobre un partido de playoff terminado, empatado y con clasificado
-- cargado. Ese partido ya está cerrado, así que el pronóstico no se puede crear
-- desde la UI. Reemplazar el email.
--
-- Como está, acierta el clasificado (✅). Para ver el ❌, cambiar el `q.n = 1`
-- por `q.n = 2`, que es el otro equipo del cruce.

-- El email va como subconsulta escalar y no como CTE en el FROM: si no matchea,
-- esto falla con "null value violates not-null constraint" en vez de insertar
-- cero filas sin decir nada. La primera versión usaba un `from me, partido` y,
-- con el placeholder sin reemplazar, no insertaba nada y no avisaba: dos
-- casilleros del checklist quedaron sin probar por eso.
insert into predictions (
  user_id, match_id, home_prediction, away_prediction, qualifier_prediction_id
)
select
  (select id from auth.users where email = 'REEMPLAZAR@mail.com'),
  m.id,
  1,
  1,
  (select id from teams order by name offset 0 limit 1)
from matches m
where m.tournament_id = (select id from tournaments where slug = 'test-sandbox')
  and m.round_number = 17
  and m.match_number = 1
on conflict (user_id, match_id)
do update set home_prediction = excluded.home_prediction,
              away_prediction = excluded.away_prediction,
              qualifier_prediction_id = excluded.qualifier_prediction_id;


-- ============================================================================
-- 5d. Pronóstico sobre el partido cargable, para probar el scoring completo
-- ============================================================================
-- Sin esto, cargar un resultado no escribe nada en round_scores: el trigger
-- `update_prediction_points` solo toca a los usuarios que pronosticaron ESE
-- partido. Con este pronóstico se ejercita la cadena entera —cargar resultado →
-- predictions.points → round_scores → tabla de posiciones— en vez de simularla
-- con puntos a mano como hace el 5b.
--
-- El partido del 3.c ya empezó, así que el pronóstico no se puede cargar desde la
-- UI. Reemplazar el email. Queda 2-1: al cargar 2-1 como resultado tiene que dar
-- el máximo de puntos, y cualquier otro marcador menos.

-- Mismo criterio que el 5c: el email como subconsulta escalar, para que un email
-- mal puesto rompa en vez de insertar cero filas en silencio.
insert into predictions (user_id, match_id, home_prediction, away_prediction)
select
  (select id from auth.users where email = 'REEMPLAZAR@mail.com'),
  m.id,
  2,
  1
from matches m
where m.tournament_id = (select id from tournaments where slug = 'test-sandbox')
  and m.round_number = 6
  and m.match_number = 4
on conflict (user_id, match_id)
do update set home_prediction = excluded.home_prediction,
              away_prediction = excluded.away_prediction;


-- ============================================================================
-- 6. LIMPIEZA — borra TODOS los torneos con slug test-
-- ============================================================================

-- delete from predictions
-- where match_id in (
--   select m.id from matches m
--   join tournaments t on t.id = m.tournament_id
--   where t.slug like 'test-%'
-- );
--
-- delete from round_scores
-- where tournament_id in (select id from tournaments where slug like 'test-%');
--
-- delete from matches
-- where tournament_id in (select id from tournaments where slug like 'test-%');
--
-- delete from rounds
-- where tournament_id in (select id from tournaments where slug like 'test-%');
--
-- delete from tournaments where slug like 'test-%';
