# Pruebas — Fase 6 (romper los god components)

Registro de la rama `refactor/fase-6-god-components`.
Descartable una vez mergeada.

**Sale de la fase 5** (`refactor/fase-5-design-system`), no de `main`: usa las
primitivas de esa fase y termina de migrar los literales que ahí quedaron
pendientes.

---

## Qué cambió

Cuatro de los cinco archivos grandes del plan, más las dos violaciones de capas
que quedaban. El quinto (`PredictionForm/index.jsx`) quedó pendiente.

| Archivo | Antes | Ahora | Qué salió |
|---|---|---|---|
| `hooks/usePersonalStats.jsx` | 587 | **85** | El cálculo entero a `utils/stats/` (8 módulos) |
| `components/RoundManager/index.jsx` | 851 | **163** | `ActiveRoundCard`, `RoundProgress`, `PlayerProgressRow`, `RoundCard`, `roundStatus.js`, `hooks/useRoundProgress.jsx` |
| `PredictionForm/MatchPrediction/index.jsx` | 614 | **189** | `MatchHeader`, `QualifierPicker`, `MatchOutcome`, `qualifier.js`, `matchWarnings.js` |
| `components/Login/index.jsx` | 440 | **223** | `authErrors.js`, `authViews.js`, `hooks/useResetCooldown.jsx`, `Common/PasswordInput` |

Tests: **375** (eran 201 al cerrar la fase 5).

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

- **El `QualifierPicker` en el navegador.** Necesita un partido de playoff con
  marcador pronosticado empatado, y no se llegó a esa combinación con los datos
  reales (`radiogroups: 0` en las dos corridas). Se cubrió con tests de render:
  las cuatro combinaciones de editable/bloqueado × elegido/no elegido, más que
  `onSelect` no se dispare cuando está deshabilitado.
- **Guardar un pronóstico de verdad.** Las comparaciones fueron de lectura. El
  `handleSaveAll` no se tocó en esta fase.
- **Enviar el mail de recuperación.** El cooldown se cubrió con tests
  (`useResetCooldown.test.jsx`, con fake timers, incluida la persistencia a
  través de un remount); no se disparó un envío real.
- **RLS.** Igual que en todas las fases: los guards son de UI. Queda para la 9.

---

## Pendiente de la fase 6

**`PredictionForm/index.jsx`, 429 líneas.** No estaba en el plan: apareció como
god component después de que las fases 1 a 5 encogieran el resto. Lo que se ve al
leerlo:

- `handleSaveAll` son ~85 líneas con la regla de los pronósticos vencidos —el
  plazo que se venció mientras el usuario cargaba— y tres armados de mensaje
  distintos. Es lógica pura y no tiene tests.
- El efecto de auto-selección de fecha (líneas 174-194) tiene un comentario largo
  explicando un bug ya arreglado; es candidato a hook (`useSelectedRound`).
- Cinco `return` tempranos de loading/vacío casi iguales.
- Quedan ~15 literales sin migrar y el bloque del resumen de la fecha está todo
  inline.

Los 208 literales que la fase 5 dejó pendientes ya se migraron en los cuatro
archivos que sí se tocaron; los de `PredictionForm` y `MatchManager/MatchResult`
siguen ahí.
