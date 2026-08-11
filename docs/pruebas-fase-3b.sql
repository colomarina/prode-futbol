-- Seed para las pruebas de la fase 3b (docs/pruebas-fase-3b.md).
-- Corre sobre `test-sandbox`, que ya tiene las 5 fechas y los 18 partidos que
-- armó docs/pruebas-fase-3a.sql. Descartable junto con el checklist.
--
-- Correr los 5 bloques en orden, de una sola vez.
--
-- Idea central: NO se escriben puntos a mano. Se cargan pronósticos de varios
-- jugadores sobre partidos ya jugados y después se toca el partido con un UPDATE,
-- que es lo que dispara `update_prediction_points`. Así los puntos y las filas de
-- `round_scores` los calcula el servidor, y el casillero "los puntos son
-- correctos" de la sección 2 se puede verificar contra el resultado real en vez
-- de contra un número que inventamos.


-- ============================================================================
-- 1. Re-sellar los tiempos (los escenarios de la 3a ya vencieron)
-- ============================================================================
-- Fecha 2: hace 1 h, para que siga fuera de Cargar Resultados (delay de 2 h).
-- Fecha 3: un partido a 5 min —dentro del cutoff de 10— y otro a 40 min.
--   El de 5 min es el que necesita la sección 1 para probar que guardar se
--   rechaza con el mensaje correspondiente.

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
-- 2. Pronósticos de otros jugadores en la fecha 1 (ya jugada)
-- ============================================================================
-- Los resultados reales de la fecha 1 son 2-1 y 0-0 (los cargó el bloque 3 de la
-- 3a). Se reparten aciertos exactos, aciertos de resultado y errores, para que la
-- tabla tenga posiciones distintas y no un empate general.
--
-- `Popi` (Ezequiel Cordoba) está en la lista de jugadores ocultos
-- (src/constants/hiddenPlayers.js): entra a propósito, para poder verificar el
-- casillero "los jugadores ocultos no aparecen en ninguna variante".
--
-- btrim en el username porque varios tienen espacios al final ('95 centavos ').

with jugadores as (
  select id, btrim(username) as username from profiles
),
partidos as (
  select id, match_number
  from matches
  where round_number = 1
    and tournament_id = (select id from tournaments where slug = 'test-sandbox')
)
insert into predictions (user_id, match_id, home_prediction, away_prediction)
select j.id, p.id, v.home_pred, v.away_pred
from (values
  -- jugador,            partido, pron_local, pron_visita   (real: #1 2-1, #2 0-0)
  ('95 centavos',        1, 2, 1),   -- exacto
  ('95 centavos',        2, 0, 0),   -- exacto
  ('CEF',                1, 3, 1),   -- gana el local, marcador errado
  ('CEF',                2, 1, 1),   -- empate, marcador errado
  ('Cubilla que tirá',   1, 0, 2),   -- errado
  ('Cubilla que tirá',   2, 0, 0),   -- exacto
  ('Los Crotos FC',      1, 1, 0),   -- gana el local, marcador errado
  ('Los Crotos FC',      2, 2, 3),   -- errado
  ('Popi',               1, 2, 1),   -- exacto, pero es jugador oculto
  ('Popi',               2, 0, 0)    -- exacto, pero es jugador oculto
) as v(username, match_number, home_pred, away_pred)
join jugadores j on j.username = v.username
join partidos p on p.match_number = v.match_number
on conflict (user_id, match_id)
do update set home_prediction = excluded.home_prediction,
              away_prediction = excluded.away_prediction;


-- ============================================================================
-- 3. Pronósticos ajenos en un partido que TODAVÍA no empezó
-- ============================================================================
-- Para la sección 4: un partido futuro no tiene que mostrar los pronósticos de
-- los demás. Van sobre el partido 1 de la fecha 6, que es en 2 días.

with jugadores as (
  select id, btrim(username) as username from profiles
),
partido as (
  select id from matches
  where round_number = 6
    and match_number = 1
    and tournament_id = (select id from tournaments where slug = 'test-sandbox')
)
insert into predictions (user_id, match_id, home_prediction, away_prediction)
select j.id, (select id from partido), v.home_pred, v.away_pred
from (values
  ('95 centavos',      1, 0),
  ('CEF',              2, 2),
  ('Cubilla que tirá', 3, 1),
  ('Los Crotos FC',    0, 1)
) as v(username, home_pred, away_pred)
join jugadores j on j.username = v.username
on conflict (user_id, match_id)
do update set home_prediction = excluded.home_prediction,
              away_prediction = excluded.away_prediction;


-- ============================================================================
-- 4. Disparar el cálculo de puntos del servidor
-- ============================================================================
-- `update_prediction_points` es AFTER UPDATE sobre `matches`: los pronósticos que
-- se insertan después de que el partido terminó no se puntúan solos. Hay que
-- provocar el UPDATE para que calcule `predictions.points` y `round_scores`.
--
-- ⚠️ Reescribir el mismo valor NO alcanza. La primera versión de este bloque hacía
-- `set home_score = home_score` y no puntuó nada: la función solo actualiza los
-- pronósticos donde `old.<campo> is distinct from new.<campo>`, así que con
-- valores idénticos el WHERE descarta todas las filas. Peor: el INSERT en
-- `round_scores` no está condicionado, así que igual crea las filas — sumando
-- puntos que siguen en NULL. Quedan todos en 0 y parece que el scoring está roto.
--
-- El cambio real se hace con `is_finished`, que no toca los resultados:
--   * paso 1 (a false): el trigger corre pero su guarda exterior
--     (`if new.is_finished = true ...`) no lo deja entrar, así que no hace nada
--   * paso 2 (a true): ahora `old.is_finished` sí difiere de `new.is_finished`,
--     y recalcula los puntos de todos los pronósticos del partido
--
-- Se incluye la fecha 17 para que el pronóstico del cuarto de final también reciba
-- sus puntos, incluido el +1 por acertar el clasificado en el empate.

update matches
set is_finished = false
where round_number in (1, 17)
  and home_score is not null
  and tournament_id = (select id from tournaments where slug = 'test-sandbox');

update matches
set is_finished = true
where round_number in (1, 17)
  and home_score is not null
  and tournament_id = (select id from tournaments where slug = 'test-sandbox');


-- ============================================================================
-- 4.b Limpieza de partidos duplicados
-- ============================================================================
-- Los INSERT de partidos del SQL de la fase 3a no eran idempotentes —`matches` no
-- tiene unique sobre (tournament_id, round_number, match_number), asi que no hay
-- `on conflict` que los frene— y cada corrida los volvia a insertar. En `test-vacio`
-- quedaron 3 copias de cada partido. Ya se agrego un `where not exists` alla; esto
-- limpia lo que quedo.
--
-- Se conserva la copia mas antigua de cada (fecha, numero). Ojo: si alguna copia
-- duplicada tuviera pronosticos asociados, el delete fallaria por la FK — en ese
-- caso hay que borrar primero esos pronosticos.

delete from matches m
using matches otra
where m.tournament_id in (select id from tournaments where slug like 'test-%')
  and otra.tournament_id = m.tournament_id
  and otra.round_number = m.round_number
  and otra.match_number = m.match_number
  and otra.created_at < m.created_at;

-- Control: cada (fecha, numero) tiene que quedar con una sola fila.
select t.slug, m.round_number, m.match_number, count(*) as copias
from matches m
join tournaments t on t.id = m.tournament_id
where t.slug like 'test-%'
group by t.slug, m.round_number, m.match_number
having count(*) > 1
order by t.slug, m.round_number, m.match_number;


-- ============================================================================
-- 5. Verificación: qué debería mostrar la tabla de posiciones
-- ============================================================================
-- Los puntos de acá son los que calculó el servidor. La pantalla tiene que
-- coincidir con esto, salvo `Popi`, que la UI debe ocultar.

select btrim(p.username) as jugador,
       rs.round_number,
       rs.total_points
from round_scores rs
join profiles p on p.id = rs.user_id
where rs.tournament_id = (select id from tournaments where slug = 'test-sandbox')
order by rs.round_number, rs.total_points desc, jugador;

-- Detalle por pronóstico, para entender de dónde sale cada total.
select btrim(pr.username) as jugador,
       m.round_number,
       m.match_number,
       concat(pred.home_prediction, '-', pred.away_prediction) as pronostico,
       concat(m.home_score, '-', m.away_score) as resultado,
       pred.points
from predictions pred
join matches m on m.id = pred.match_id
join profiles pr on pr.id = pred.user_id
where m.tournament_id = (select id from tournaments where slug = 'test-sandbox')
order by m.round_number, m.match_number, pred.points desc nulls last;
