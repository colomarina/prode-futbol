# Pruebas — Fase 6 (romper los god components)

Registro de la rama `refactor/fase-6-god-components`.
Descartable una vez mergeada.

**Sale de la fase 5** (`refactor/fase-5-design-system`), no de `main`: usa las
primitivas de esa fase y termina de migrar los literales que ahí quedaron
pendientes.

---

## Qué cambió

Los cinco archivos grandes, más las dos violaciones de capas que quedaban.

| Archivo | Antes | Ahora | Qué salió |
|---|---|---|---|
| `hooks/usePersonalStats.jsx` | 587 | **85** | El cálculo entero a `utils/stats/` (8 módulos) |
| `components/RoundManager/index.jsx` | 851 | **163** | `ActiveRoundCard`, `RoundProgress`, `PlayerProgressRow`, `RoundCard`, `roundStatus.js`, `hooks/useRoundProgress.jsx` |
| `PredictionForm/MatchPrediction/index.jsx` | 614 | **189** | `MatchHeader`, `QualifierPicker`, `MatchOutcome`, `qualifier.js`, `matchWarnings.js` |
| `components/Login/index.jsx` | 440 | **223** | `authErrors.js`, `authViews.js`, `hooks/useResetCooldown.jsx`, `Common/PasswordInput` |
| `components/PredictionForm/index.jsx` | 429 | **223** | `savePredictions.js`, `formPlaceholder.js`, `hooks/useSelectedRound.js`, `RoundSelector`, `RoundSummary`, `ActiveRoundShortcut`, `LockedRoundNotice` |

Tests: **414** (eran 201 al cerrar la fase 5).

### Las dos violaciones de capas quedaron cerradas

- **Cero** imports de `lib/supabase` en `src/components/` (era solo
  `RoundManager`, que ahora usa `hooks/useRoundProgress`).
- **Cero** `useEffect` de fetching en `src/hooks/`. Los cuatro que quedan en
  `useAllPredictions` son de estado de UI (deep link y reset de selección), no de
  datos.

### Primitiva nueva compartida

`Common/PasswordInput` reemplaza tres implementaciones del mismo campo con ojo:
una en `Login` (con `IconButton` y estilos inline) y dos en `UserProfile` (con
`<button>` crudo y clases propias). Medido en el navegador, el ojo tenía **26px
de alto en el login y 35px en el perfil**; ahora los dos miden 30.

---

## Resultado

**Todo verificado.** `pnpm lint && pnpm format:check && pnpm test && pnpm build`
en verde.

La verificación no fue a ojo: para cada componente se levantó un **segundo dev
server sobre un `git worktree` en el commit anterior** (`:5199` contra `:5173`) y
se compararon las dos versiones midiendo el DOM renderizado —colores resueltos,
padding, margen, radios, tamaños de letra, estados de los inputs y texto
completo— con la misma sesión copiada entre orígenes.

| Qué se comparó | Resultado |
|---|---|
| `buildTournamentStats` viejo vs nuevo, 500 fixtures aleatorios + 6 casos borde | ✅ idéntico |
| `/estadisticas` en Clausura 2026 y Mundial 2026, ambos temas | ✅ sin `undefined`/`NaN`, gráficos con datos |
| `/admin/fechas` antes vs después | ✅ mismo texto, 16 badges, 4 conteos, 3 tarjetas |
| `/pronosticos` en Clausura 2026 (editable) y Mundial 2026 (consulta) | ✅ mismo texto, mismos inputs y estados |
| Login en sus tres vistas, sin sesión | ✅ mismo texto, mismos campos y botones |
| `/perfil`, los dos campos de contraseña | ✅ independientes, con su `aria-label` correcto |

Cero errores de JS en todas las corridas.

Los scripts quedaron en el scratchpad de la sesión (`qa/90` a `qa/95`), no en el
repo: dependen de un worktree y de dos servers levantados a mano.

---

## Cambios visuales deliberados

Todos vienen de migrar a la escala de tokens los literales que la fase 5 había
diferido en estos archivos. **Ninguno es un accidente**, pero son visibles:

| Dónde | Antes | Ahora | Por qué |
|---|---|---|---|
| Título de "Gestión de Fechas" y del login | `1.75rem` | `--font-size-2xl` (1.5rem) | 1.75 no está en la escala. Además `MatchManager` —la otra pestaña de admin— ya usaba 1.5rem, así que los dos paneles quedaron iguales |
| Badges de estado de fecha y conteo de partidos | `padding: 3px 10px` | `2px 12px` | Ninguno de los dos valores estaba en la escala |
| Tarjetas del resumen de progreso | `radius: 10px` | `--radius-lg` (12px) | `tokens.css` ya documentaba que 10 y 12 colapsan en `lg` |
| Conteo "15/15" de una fecha completa | `--color-primary` | `--color-primary-text` | Era el último sitio con el primario como color de letra; en el Mundial daba 1.92:1 |
| Tarjeta de la fecha activa | `padding: 28px` | `--space-xl` (24px) | Idem |
| Separación entre tarjetas de pronóstico | 40px | 32px | Ver abajo |
| Ojo de la contraseña | 26px (login) / 35px (perfil) | 30px en los dos | Se unificó el control |

### La separación entre tarjetas de pronóstico

`PredictionForm` tenía **dos mecanismos de espaciado sumándose**: un `gap: 16px`
en el contenedor de la lista más el `margin-bottom: 24px` que traía la clase
global `.card`. O sea 40px reales que no estaban escritos en ningún lado.

Ahora `MatchPrediction` no lleva margen propio y la lista decide con
`gap: var(--space-2xl)` (32px). Si se prefiere volver a los 40px, es cambiar ese
token por `--space-3xl` (48) o poner el valor a mano; el mecanismo ya es uno solo.

Esto **se detectó midiendo**: todas las propiedades comparadas daban idénticas y
solo cambiaba la altura de la página. El medidor no incluía `margin`. Fue el
único hallazgo real de las comparaciones.

### La animación que no existía

El badge "⚽ En Juego" declaraba `animation: pulse 2s ...` pero **el `@keyframes
pulse` no estaba definido en ninguna parte del proyecto**: nunca latió. Ahora está
definido en `MatchHeader.module.css`, suave y con `prefers-reduced-motion`. Si no
se lo quiere, es borrar la regla `.status[data-status='playing']`.

---

## Diferencias de comportamiento, a propósito

Son tres, todas por unificar reglas que estaban duplicadas y podían discrepar:

1. **Finalizar una fecha.** La condición estaba escrita cinco veces inline en el
   botón (fondo, cursor, opacity, hover y title) y el handler la volvía a evaluar
   con sus propios mensajes. Ahora es `getFinishability()` y el mensaje es uno.
   Una fecha con 0 partidos daba "finalizable" por la comparación `0 >= 0` y el
   handler la rechazaba después; ahora las dos coinciden.

2. **Los tres contadores de progreso.** No eran exhaustivos: la fila del detalle
   decidía su color con `progress === 100` / `> 0`, y los contadores filtraban con
   `> 0 && < 100` / `=== 0`. Un progreso raro no caía en ningún contador mientras
   la fila sí lo pintaba. Ahora los tres suman siempre el total (hay un test).

3. **Validación del login.** Los errores se mostraban de a uno (primero el del
   email; el de la contraseña recién al completar el email) y los dos campos del
   perfil se validaban ya dentro del `try`, con el formulario en estado
   "enviando". Ahora es una sola pasada y muestra todo junto. Casi nunca se ve:
   los inputs son `required`, así que el navegador bloquea el vacío y a la
   validación solo llegan los campos con espacios.

Y una corrección: `RoundProgress` ordena una **copia** de los jugadores. El
original hacía `usersPredictions.sort(...)` en el render, mutando el array; ahora
ese array viene del cache de React Query y mutarlo lo corrompería.

---

## Lo que quedó sin verificar

- ~~El `QualifierPicker` en el navegador~~ → **verificado** al cerrar la fase, en
  `test-sandbox`: un `1-1` en un partido de playoff lo muestra, el clasificado
  elegido a mano se guarda y con marcador definido queda forzado al ganador. Ver
  "Escritura real" más abajo. Además tiene tests de render: las cuatro
  combinaciones de editable/bloqueado × elegido/no elegido, más que `onSelect` no
  se dispare cuando está deshabilitado.
- ~~Guardar un pronóstico de verdad~~ → **verificado** contra la base en
  `test-sandbox`, ida y vuelta incluida. Ver "Escritura real" más abajo.
- **Enviar el mail de recuperación.** El cooldown se cubrió con tests
  (`useResetCooldown.test.jsx`, con fake timers, incluida la persistencia a
  través de un remount); no se disparó un envío real.
- **RLS.** Igual que en todas las fases: los guards son de UI. Queda para la 9.

---

## `PredictionForm/index.jsx`: el quinto god component

No estaba en el plan original: apareció como god component después de que las
fases 1 a 5 encogieran el resto. **429 → 223 líneas**, y ahora es un orquestador:
qué fecha se mira, qué se guarda y qué pantalla de espera se muestra son tres
módulos con tests.

| Nuevo | Qué se llevó |
|---|---|
| `PredictionForm/savePredictions.js` | El armado del payload, la regla de los pronósticos vencidos y los cinco mensajes posibles del toast, que eran tres armados inline más el de error |
| `hooks/useSelectedRound.js` | El estado de la fecha, el ref de selección manual, el reset por cambio de torneo y el efecto de auto-selección |
| `PredictionForm/formPlaceholder.js` | Cuatro de los cinco `return` tempranos, que eran el mismo `container` + `LoadingState`/`EmptyState` |
| `RoundSelector`, `RoundSummary`, `ActiveRoundShortcut`, `LockedRoundNotice` | El JSX con sus estilos, ahora en módulos CSS |

Tres cosas que salieron de leerlo con atención:

1. **El payload se arma en el click, no en el render.** Es tentador memoizarlo
   junto con el `disabled` del botón, pero el filtro por plazo depende del reloj y
   el memo no se recalcula cuando pasa un minuto: un partido que venció entre el
   último render y el click habría viajado igual, y además habría contado como
   vencido en el mensaje. El botón usa el memo; el handler recalcula.
2. **El texto del resumen ya no dice "10 minutos" a mano**: sale de
   `PREDICTION_CUTOFF_MINUTES`, que es la regla de `utils/matchTiming.js`.
3. **"Ir a la fecha abierta" volvió a ser un `followActiveRound`.** Antes seteaba
   la fecha sin marcar selección manual, o sea que el usuario seguía a la fecha
   activa si se abría otra mientras la pantalla estaba abierta. Convertirlo en un
   `selectRound` más habría perdido ese matiz, así que el hook lo expone aparte y
   hay un test.

El selector aparece en dos pantallas con espaciado distinto —la del formulario sin
padding, la de "fecha sin partidos" con padding—, así que la tarjeta que lo
envuelve quedó en el que lo usa y `RoundSelector` es solo la config del dropdown.
Unificarlas sería un cambio visual, no un refactor.

Las dos tarjetas y el contenedor **replican** las clases globales `.card` y
`.container` en vez de combinarse con ellas, que es lo que ya hacían los módulos de
`AllPredictions` y `RoundManager`. Así el padding y el `max-width: 900px` —que
antes venía de un `style` inline y le ganaba también a la media query de 1024px—
no dependen de qué hoja de estilos cargó última. Ninguna regla global apunta a
descendientes de `.card` ni de `.container`, se verificó.

Los 208 literales que la fase 5 dejó pendientes ya se migraron, salvo los ~28 de
`MatchManager/MatchResult/index.jsx` (308 líneas), que quedan como opcionales.

### Verificación en el navegador

Mismo método que el resto de la fase: worktree en el commit anterior, `:5199`
contra `:5174`, sesión de `test-colo` copiada entre orígenes. Acá el diff no fue
por sondas sino **de todo el árbol**: cada nodo bajo `#root` en orden de documento,
con 58 propiedades computadas (margin y padding lado por lado incluidos) más
`getBoundingClientRect`, la altura del documento y el texto completo.

| Caso | Nodos | Diferencias |
|---|---|---|
| Clausura 2026, claro, 1280px | 636 | 0 |
| Clausura 2026, oscuro, 1280px | 636 | 0 |
| Clausura 2026, claro, 390px | 636 | 0 |
| Mundial 2026 (consulta), claro, 1280px | 449 | 0 |
| Mundial 2026 (consulta), oscuro, 390px | 449 | 0 |
| Fecha sin partidos (Fecha 15), claro y oscuro | 389 | 0 |
| Ida y vuelta Fecha 5 → 15 → 5 | 636 | 0 |
| Con dos goles tipeados | 636 | 0 |
| Scrolleado al fondo (barra sticky) | 636 | 0 |

Alturas de documento idénticas en todos los casos (3600px en Fecha 5, 900 en la
fecha vacía), que es lo que delató el hallazgo de `margin` en las comparaciones
anteriores. Los 3 errores de consola son los mismos en las dos versiones (el aviso
de `element.ref` de React 19, preexistente).

**Control negativo.** Un "0 diferencias" no significa nada si las dos versiones
son la misma. Se verificó que los nodos medidos tienen clases distintas y que el
`style` inline desapareció:

| Nodo | Antes | Ahora |
|---|---|---|
| contenedor | `class="container"` + style inline | `_container_18q2k_2`, sin inline |
| tarjeta del selector | `class="card"` + style inline | `_selectorCard_18q2k_35`, sin inline |
| caja del resumen | sin clase, todo inline | `_box_1l79u_10`, sin inline |
| lista de partidos | sin clase, todo inline | `_matches_18q2k_63`, sin inline |

**Comportamiento del botón Guardar**, afirmado en absoluto y no solo comparado:

| Paso | Antes | Ahora |
|---|---|---|
| sin nada cargado | deshabilitado | deshabilitado |
| solo el gol del local | deshabilitado | deshabilitado |
| marcador completo | **habilitado** | **habilitado** |
| se borra el gol del visitante | deshabilitado | deshabilitado |
| un `0` como gol | **habilitado** | **habilitado** |
| tras cambiar de fecha a una jugada | sin botón | sin botón |

Un dato del medidor, para la próxima: el primer intento dio 15 y 16 diferencias en
los dos casos oscuros. **Eran todas del medidor**: el `addInitScript` que copia la
sesión al otro origen corre en *cada* navegación, así que pisaba el `theme` recién
seteado y la versión vieja se medía en claro contra la nueva en oscuro. Se arregló
escribiendo solo las claves ausentes, y el colector ahora devuelve
`data-theme`/`data-tournament`/`pathname` para que el diff aborte si los dos lados
no están en el mismo contexto en vez de reportar 15 diferencias de color.

### Escritura real, en `test-sandbox`

Se probó guardar de verdad, con la cuenta de admin y **sobre el torneo de prueba**
(`test-sandbox`, fecha "Cuartos de final", que tiene 3 partidos de playoff todavía
editables). Nunca sobre Clausura ni Mundial.

| Paso | Resultado |
|---|---|
| Estado inicial, nada cargado | botón deshabilitado, 6 inputs editables |
| Partido A `2-1` | botón habilitado, **no** aparece selector de clasificado (hay ganador) |
| Partido B `1-1` | aparece el segundo `radiogroup`, habilitado, con el local propuesto |
| Se elige el visitante como clasificado | queda `Atlético Tucumán` en lugar del default |
| Click en Guardar | toast **success**: "2 pronósticos guardados correctamente" |
| Recarga | los cuatro valores y el clasificado elegido siguen ahí |
| Se cambia el partido A a `3-0` y se guarda | toast success, y tras recargar quedan `3-0` y `1-1` |
| `test-vacio` (torneo sin partidos) | 0 inputs, sin botón, pantalla vacía con el selector |

Contra la base, después de las dos escrituras:

| Partido | Guardado | Clasificado |
|---|---|---|
| #5 Aldosivi–Arabia Saudí | `3-0`, una sola fila, `updated_at` de la segunda pasada | Aldosivi, o sea el ganador automático |
| #6 Argentina–Atlético Tucumán | `1-1` | **Atlético Tucumán**, el que se eligió a mano y no el local por default |
| #7 (editable, no se tocó) | sin pronóstico | — |
| #1 (pronóstico viejo del 10/08) | intacto | intacto |

O sea: el upsert no duplicó filas, el clasificado viaja bien en las dos ramas
(forzado por el marcador y elegido a mano), y **no se escribió nada de los partidos
que no estaban en el payload**. Con esto queda cubierto también el
`QualifierPicker` en el navegador, que la fase 6 había dejado sin verificar por no
haber llegado a un empate con datos reales.

Un detalle de comportamiento **preexistente** que se ve en el segundo guardado: el
toast dijo "2 pronósticos" aunque solo se cambió uno. Es correcto y no cambió con
el refactor — tras recargar, `MatchPrediction` siembra los valores guardados, así
que todos los partidos editables completos vuelven a entrar en el payload y se
re-upsertean. Si algún día molesta, el lugar es `collectPredictionsToSave`:
compararía contra `predictionsByMatchId` como ya hace `findExpiredPredictions`.
