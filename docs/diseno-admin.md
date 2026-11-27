# Diseño: limpiar el admin

Estado: **aprobado en charla el 27/11/2026** (enfoques A y A). Plan: `docs/plan-admin.md`.

## Para qué

El admin se usa en el celular, cada semana, para cuatro cosas: cargar la fecha (hoy por SQL;
después, con el importador de ESPN), **ver quién pronosticó** para avisarle por privado al que
falta, **corregir horarios** y **cargar resultados**. Las pantallas están armadas alrededor de
cosas que ya no se hacen (los estados de fecha) y lo que sí se hace queda a uno o dos pasos.

Lo que salió de la crítica de diseño (capturas a 360 px):

- **Fechas** mide 3.500 px: 18 tarjetas con un selector de estado que no sirve, y el progreso
  está escondido detrás de "Ver detalles".
- **El progreso cuenta 20 personas y en el Clausura juegan 7**: la RPC cruza contra todos los
  perfiles. "Faltan partidos: #1 #2" usa el número de cuadro, que no se ve en ningún lado.
- **Resultados** arranca vacío y obliga a elegir fecha. Adentro, cargados y pendientes se ven
  iguales (octavos: 8 tarjetas, 4.200 px) y el panel de penales sale incluso con ganador.
- **Horarios** arranca en la Fecha 1 (vacía) y repite cada hora dos veces.

## Verificado antes de decidir

- **Los estados de fecha no deciden nada.** Los puntos los calcula el trigger
  `update_points_on_match_result` sobre `matches`. La fecha activa, la tabla y la llave salen de
  los partidos. El progreso usa `_v2` con número de fecha. Los triggers de `rounds` solo actúan
  si alguien cambia el estado. `openNextRound`, `lockRound` e `isRoundOpen` no tienen uso.
- Lo único que lee el estado fuera del panel: el 🏁/⚽ del selector de "Ver pronósticos".
- La columna se queda (tiene CHECK); se arregla su default roto `'closed'`.

## Decisiones

- **Jugador activo = pronosticó algo en este torneo.** Hoy: 7 en el Clausura.
- **El filtro va en la base** (enfoque A): `get_round_predictions_summary_by_tournament_v2`
  cuenta solo perfiles con al menos un pronóstico en ese torneo. Descartado filtrar en el cliente:
  la regla quedaría en un lugar que otra pantalla puede olvidar.
- **Un PR por pantalla** (enfoque A): Fechas → Resultados → Horarios. Son pantallas solo de admin,
  así que se pueden desplegar con el torneo en juego.

### Fechas

- Se van los estados: la lista de `RoundCard`, "Finalizar fecha" y el código muerto de
  `useRounds`.
- Queda la fecha activa con el progreso **desplegado de entrada**: tres contadores en una fila y la
  lista de jugadores, los que más les falta primero.
- Lo que falta se muestra con el cruce ("Vélez vs Independiente"), no con el número.
- Ahí se va a enchufar después el importador de ESPN (`docs/diseno-importar-fecha-espn.md`).

### Resultados

- Abre en **la fecha con resultados pendientes**: la más vieja que tiene un partido que ya se
  puede cargar (`canLoadResult`) y no está terminado. Si no hay, la última fecha cargable.
- Arriba, los pendientes con la tarjeta de hoy. Abajo, los cargados en una línea, solo lectura
  (hoy ya no se pueden editar: los inputs están deshabilitados con `is_finished`).
- El selector de penales sale **solo con empate**, con la misma regla y el mismo componente que
  "Mis pronósticos" (`qualifier.ts`, `QualifierPicker`). Esto cambia la UI del admin; la escritura
  (`qualifier_team_id`) no cambia.

### Horarios

- Abre en la fecha activa.
- Cada partido muestra solo el input; si se cambió y no se guardó, "antes: 20:00".
- El botón de guardar queda fijo abajo, como en Resultados.

### Las tres

Mismo encabezado (`Common/PageHeader`: título y una línea), sin los subtítulos que describen
cosas que ya no existen.

### Fuera de alcance

El importador de ESPN, avisos al celular (descartado), editar resultados ya cargados, y la
duplicación del `marginTop: 36px` si no cae sola con la tarjeta nueva.
