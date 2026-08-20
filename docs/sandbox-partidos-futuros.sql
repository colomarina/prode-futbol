-- Fecha 7 del Sandbox de pruebas, con partidos EN EL FUTURO.
--
-- Para qué: todas las fechas del sandbox tienen partidos del 10 al 15 de agosto de
-- 2026, así que `canPredictMatch()` da falso en todas y no hay una sola cajita
-- editable. Sin eso no se puede probar un guardado real de pronósticos de punta a
-- punta.
--
-- Es el mecanismo que el proyecto ya tiene para esto: los torneos con slug `test-`
-- solo los ven los admins y están en `active` justamente para poder escribirles.
--
-- Las fechas van relativas a `now()` y no hardcodeadas, así que este script no
-- vence. El cierre de pronósticos es 10 minutos antes de cada partido
-- (`PREDICTION_CUTOFF_MINUTES` en `src/utils/matchTiming.ts`), así que con +2 días
-- sobra.
--
-- **Se puede correr más de una vez**: los dos inserts están guardados con
-- `where not exists`, así que no duplican nada.
--
-- Ejecutar en el SQL editor de Supabase, de arriba a abajo.

-- ---------------------------------------------------------------------------
-- 0. PREFLIGHT. Correr esto primero, solo.
--
-- Tiene que devolver **cero filas**. Si devuelve algo, ese slug no existe en
-- `teams` y hay que corregirlo antes de seguir: los equipos se eligen por slug, y un
-- slug mal escrito no da error de tipeo sino un `null` en `home_team_id`, que es
-- exactamente cómo falló la primera versión de este script (`racing-club` no existe,
-- el equipo es `racing`).
select s.slug as slug_que_no_existe
from (
  values
    ('boca-juniors'), ('river-plate'),
    ('racing'), ('independiente'),
    ('san-lorenzo'), ('huracan'),
    ('rosario-central'), ('newells-old-boys')
) as s (slug)
where not exists (select 1 from teams t where t.slug = s.slug);

-- ---------------------------------------------------------------------------
-- 1. La fecha.
--
-- `status` no decide nada del comportamiento —la app deriva la fecha activa de los
-- `match_date`, no de esto— pero la fila tiene que existir para que `useRounds` la
-- liste y aparezca en el selector.
--
-- Va con `where not exists` y no con `on conflict do nothing`, porque este último
-- solo evita el duplicado si hay un índice único sobre (tournament_id,
-- round_number), y no está garantizado que lo haya.
insert into rounds (tournament_id, round_number, name, status)
select
  '1e7140a6-7b29-4cc8-81fd-dcf9c166192e',  -- test-sandbox
  7,
  'Fecha 7 (futura, para probar guardado)',
  'open'
where not exists (
  select 1 from rounds
  where tournament_id = '1e7140a6-7b29-4cc8-81fd-dcf9c166192e'
    and round_number = 7
);

-- ---------------------------------------------------------------------------
-- 2. Los cuatro partidos.
--
-- El `join` con `teams` es lo que hace imposible el error de la primera versión: si
-- un slug no existe, la fila **no se inserta** en vez de insertarse con un `null`.
-- El paso 3 lo delata, porque van a faltar filas.
--
-- `matches.status` se omite a propósito: es una columna muerta (ver
-- `docs/supabase-schema.md`), el cliente no la lee.
with nuevos (match_number, local, visitante, cuando) as (
  values
    (1, 'boca-juniors', 'river-plate', now() + interval '2 days'),
    (2, 'racing', 'independiente', now() + interval '2 days 3 hours'),
    (3, 'san-lorenzo', 'huracan', now() + interval '3 days'),
    (4, 'rosario-central', 'newells-old-boys', now() + interval '3 days 2 hours')
)
insert into matches (
  tournament_id, round_number, match_number,
  home_team_id, away_team_id,
  match_date, is_finished, is_playoff
)
select
  '1e7140a6-7b29-4cc8-81fd-dcf9c166192e',
  7,
  n.match_number,
  h.id,
  a.id,
  n.cuando,
  false,
  false
from nuevos n
  join teams h on h.slug = n.local
  join teams a on a.slug = n.visitante
where not exists (
  select 1 from matches m
  where m.tournament_id = '1e7140a6-7b29-4cc8-81fd-dcf9c166192e'
    and m.round_number = 7
    and m.match_number = n.match_number
);

-- ---------------------------------------------------------------------------
-- 3. Verificación. Tienen que salir **4 filas**, todas con `editable = true`.
--
-- Si salen menos de 4, faltó un slug: volver al paso 0.
select
  m.match_number,
  h.name as local,
  a.name as visitante,
  m.match_date,
  m.match_date > now() + interval '10 minutes' as editable
from matches m
  join teams h on h.id = m.home_team_id
  join teams a on a.id = m.away_team_id
where m.tournament_id = '1e7140a6-7b29-4cc8-81fd-dcf9c166192e'
  and m.round_number = 7
order by m.match_number;

-- ---------------------------------------------------------------------------
-- ROLLBACK, si querés dejar el sandbox como estaba.
--
-- El orden importa: primero los pronósticos que se hayan cargado sobre estos
-- partidos, porque `predictions.match_id` los referencia.
--
-- delete from predictions
--  where match_id in (
--    select id from matches
--     where tournament_id = '1e7140a6-7b29-4cc8-81fd-dcf9c166192e'
--       and round_number = 7
--  );
--
-- delete from matches
--  where tournament_id = '1e7140a6-7b29-4cc8-81fd-dcf9c166192e'
--    and round_number = 7;
--
-- delete from rounds
--  where tournament_id = '1e7140a6-7b29-4cc8-81fd-dcf9c166192e'
--    and round_number = 7;
--
-- Nota: si ya se calcularon puntos, `round_scores` también tendría filas de la
-- fecha 7. No debería pasar mientras nadie cargue resultados ni corra el cálculo.
