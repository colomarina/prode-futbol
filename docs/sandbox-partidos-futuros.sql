-- Fecha 7 del Sandbox de pruebas, con partidos EN EL FUTURO.
--
-- Para qué: hasta ahora todas las fechas del sandbox tienen partidos pasados
-- (10 al 15 de agosto de 2026), así que `canPredictMatch()` da falso en todas y no
-- hay una sola cajita editable. Sin eso no se puede probar un guardado real de
-- pronósticos de punta a punta.
--
-- Es el mecanismo que el proyecto ya tiene para esto: los torneos con slug `test-`
-- solo los ven los admins y están en `active` justamente para poder escribirles.
--
-- Las fechas van relativas a `now()` y no hardcodeadas, así que este script no
-- vence: corrélo cuando quieras y los partidos van a quedar siempre a futuro.
-- El cierre de pronósticos es 10 minutos antes de cada partido
-- (`PREDICTION_CUTOFF_MINUTES` en `src/utils/matchTiming.ts`), así que con +2 días
-- sobra.
--
-- Ejecutar en el SQL editor de Supabase.

-- 1. La fecha. `status` no decide nada del comportamiento —la app deriva la fecha
--    activa de los `match_date`, no de esto— pero la fila tiene que existir para que
--    `useRounds` la liste y aparezca en el selector.
insert into rounds (tournament_id, round_number, name, status)
values (
  '1e7140a6-7b29-4cc8-81fd-dcf9c166192e',  -- test-sandbox
  7,
  'Fecha 7 (futura, para probar guardado)',
  'open'
)
on conflict do nothing;

-- 2. Los cuatro partidos.
--    Los equipos se eligen por `slug` en vez de pegar UUIDs, así se lee qué es cada
--    uno y no hay que actualizar el script si cambian los ids.
--    `matches.status` se omite a propósito: es una columna muerta (ver
--    `docs/supabase-schema.md`), el cliente no la lee.
insert into matches (
  tournament_id, round_number, match_number,
  home_team_id, away_team_id,
  match_date, is_finished, is_playoff
)
values
  (
    '1e7140a6-7b29-4cc8-81fd-dcf9c166192e', 7, 1,
    (select id from teams where slug = 'boca-juniors'),
    (select id from teams where slug = 'river-plate'),
    now() + interval '2 days', false, false
  ),
  (
    '1e7140a6-7b29-4cc8-81fd-dcf9c166192e', 7, 2,
    (select id from teams where slug = 'racing-club'),
    (select id from teams where slug = 'independiente'),
    now() + interval '2 days 3 hours', false, false
  ),
  (
    '1e7140a6-7b29-4cc8-81fd-dcf9c166192e', 7, 3,
    (select id from teams where slug = 'san-lorenzo'),
    (select id from teams where slug = 'huracan'),
    now() + interval '3 days', false, false
  ),
  (
    '1e7140a6-7b29-4cc8-81fd-dcf9c166192e', 7, 4,
    (select id from teams where slug = 'rosario-central'),
    (select id from teams where slug = 'newells-old-boys'),
    now() + interval '3 days 2 hours', false, false
  );

-- 3. Verificación: tienen que salir 4 filas, todas con `editable = true`.
select
  m.round_number,
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
