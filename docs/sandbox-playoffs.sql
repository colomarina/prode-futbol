-- Cuadro de playoffs de prueba para el torneo `test-sandbox` (solo lo ven los admins).
--
-- Sirve para ver en /playoffs lo que el Clausura todavía no tiene: ganadores, un
-- empate definido por penales, uno sin clasificado cargado, un partido en juego,
-- cuartos a medio cargar y los conectores del cuadro.
--
-- Reemplaza los playoffs que tuviera el sandbox: borra sus partidos de playoff, los
-- pronósticos de esos partidos y los round_scores de las fechas 16 y 17 del sandbox.
-- No toca ningún otro torneo. Los horarios son relativos a now(): correrlo de nuevo
-- vuelve a dejar un partido "en juego".
--
-- match_number = posición en el cuadro: el cuarto i sale de los octavos 2i-1 y 2i.

begin;

delete from predictions
where match_id in (
  select id from matches
  where tournament_id = '1e7140a6-7b29-4cc8-81fd-dcf9c166192e' and is_playoff
);

delete from round_scores
where tournament_id = '1e7140a6-7b29-4cc8-81fd-dcf9c166192e' and round_number in (16, 17);

delete from matches
where tournament_id = '1e7140a6-7b29-4cc8-81fd-dcf9c166192e' and is_playoff;

-- status explícito: el default de rounds.status ('closed') viola su propio CHECK.
insert into rounds (tournament_id, round_number, name, status)
values ('1e7140a6-7b29-4cc8-81fd-dcf9c166192e', 16, 'Octavos de Final', 'pending')
on conflict (tournament_id, round_number) do nothing;

insert into matches (tournament_id, round_number, match_number, match_date, home_team_id,
                     away_team_id, home_score, away_score, qualifier_team_id, is_finished,
                     is_playoff, playoff_stage, status)
select '1e7140a6-7b29-4cc8-81fd-dcf9c166192e', v.ronda, v.n, now() + v.cuando,
       h.id, a.id, v.gl, v.gv, q.id, v.terminado, true, v.etapa, 'pending'
from (values
  -- octavos
  (16, 'octavos', 1, interval '-4 days',     'instituto',          'huracan',                 0,    2,    null,          true),
  (16, 'octavos', 2, interval '-4 days' + interval '3 hours',
                                             'river-plate',        'lanus',                   1,    1,    'river-plate', true),  -- penales
  (16, 'octavos', 3, interval '-3 days',     'argentinos-juniors', 'independiente',           3,    1,    null,          true),
  (16, 'octavos', 4, interval '-3 days' + interval '3 hours',
                                             'velez-sarsfield',    'belgrano',                1,    1,    null,          true),  -- empate sin clasificado cargado
  (16, 'octavos', 5, interval '-2 days',     'rosario-central',    'gimnasia-de-mendoza',     2,    0,    null,          true),
  (16, 'octavos', 6, interval '-2 days' + interval '3 hours',
                                             'defensa-y-justicia', 'barracas-central',        0,    1,    null,          true),
  (16, 'octavos', 7, interval '-30 minutes', 'boca-juniors',       'independiente-rivadavia', null, null, null,          false), -- en juego
  (16, 'octavos', 8, interval '2 days',      'gimnasia-y-esgrima-lp', 'newells-old-boys',     null, null, null,          false),
  -- cuartos: 2 de 4 cargados, en su posición del cuadro (1 y 3)
  (17, 'cuartos', 1, interval '5 days',      'huracan',            'river-plate',             null, null, null,          false),
  (17, 'cuartos', 3, interval '6 days',      'rosario-central',    'barracas-central',        null, null, null,          false)
) as v(ronda, etapa, n, cuando, local, visitante, gl, gv, clasificado, terminado)
join teams h on h.slug = v.local
join teams a on a.slug = v.visitante
left join teams q on q.slug = v.clasificado;

-- Tiene que dar 8 octavos y 2 cuartos; si no, algún slug no matcheó y se descarta todo.
do $$
declare
  total int;
begin
  select count(*) into total from matches
  where tournament_id = '1e7140a6-7b29-4cc8-81fd-dcf9c166192e' and is_playoff;
  if total <> 10 then
    raise exception 'Se esperaban 10 partidos de playoff en el sandbox y hay %', total;
  end if;
end $$;

commit;
