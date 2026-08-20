# Refactor: lo que queda (fases 8, 9 y 10)

Este documento existe para poder **arrancar una conversación nueva sin contexto
previo**. El plan original completo está en
`~/.claude/plans/te-animas-a-hacer-groovy-sutton.md` (fuera del repo), pero está
escrito contra el estado de hace 6 fases: varios de sus números y varios de sus
puntos ya no aplican. Acá está el estado **verificado** al cerrar la fase 7.

Registros por fase: `docs/pruebas-fase-3a.md`, `-3b`, `-4`, `-6`, `-7`.

---

## Estado al cerrar la fase 7

Rama actual: `refactor/fase-7-typescript`, sale de `refactor/fase-5-design-system`
(que ya tiene la fase 6 mergeada).

**Estrategia de ramas acordada:** las fases 6 a 10 se mergean a la rama de la fase 5,
y esa es la que va a `main`. El motivo es que la fase 5 dejó cambios visuales chicos
que hay que revisar juntos al final, antes de mergear. Cada fase nace de
`refactor/fase-5-design-system` y vuelve ahí al terminar.

`main` no tiene ningún commit que la fase 5 no tenga, así que no hay divergencia.

Métricas verificadas:

| | Valor |
|---|---|
| Tests | 414 en 48 archivos |
| Archivos `.ts`/`.tsx` (sin tests) | 157 |
| Archivos `.js`/`.jsx` que quedan | 2, los helpers de test |
| Imports de Supabase en componentes | 0 |
| `useEffect` de fetching en hooks | 0 |
| Deuda de `strict` | 241 errores en 4 flags (ver fase 10) |

`pnpm lint && pnpm typecheck && pnpm format:check && pnpm test && pnpm build` en
verde.

**Ojo con la métrica de líneas.** Al empezar la fase 6 había 12 archivos de más de
250 líneas y al cerrarla 7; ahora hay **11**. No es una regresión: la fase 7 les sumó
anotaciones de tipo y comentarios a los archivos que ya eran grandes
(`useWorldCupBonus` 208 → 289, `useLeaderboard` 210 → 267, `AuthContext` 211 → 263).
El conteo de líneas dejó de ser un buen proxy de complejidad: los que importan siguen
siendo los mismos de antes.

### `MatchManager/MatchResult`: se decidió no tocarlo en la fase 6

Era el punto opcional que quedaba de la fase 6 (308 líneas, ~28 literales fuera de
la escala de tokens). Se leyó entero y **la decisión fue dejarlo como está**:

- **No es un god component.** De sus 308 líneas, ~90 son lógica y ya delegan en
  `utils/matchTiming`, `utils/score` y `utils/matchDate`. El resto es JSX con
  estilos inline. Partirlo no sacaría a la luz ninguna regla sin test: sacaría
  markup de un archivo y lo pondría en otro.
- **Migrar sus literales es un cambio visual, no un refactor.** `0.75rem`,
  `0.8rem`, `0.85rem` y `0.9rem` no están en la escala, así que normalizarlos
  cambia tamaños de letra en el panel de admin y suma superficie nueva a revisar en
  un merge cuya razón de ser era justamente revisar los cambios visuales juntos.
  La rama recién llegó a "0 diferencias medidas"; agregar churn cosmético ahora no
  compra nada.
- **Las fases 7 y 8 lo van a abrir igual** (TypeScript en `MatchManager/**`, y el
  repaso de accesibilidad). Ese es el momento natural para normalizar los tokens:
  el archivo ya está abierto y la revisión visual del merge ya pasó.

**Lo que sí conviene anotar, porque es duplicación real y no cosmética:**
`MatchResult` reimplementa inline la regla del clasificado por penales —ganador
automático, bloqueo, efecto de sincronización— que `MatchPrediction/qualifier.js`
ya encapsula y tiene con tests. No son idénticas: el formulario de pronósticos
muestra el selector **solo si el marcador es empate** (`shouldShowPicker`), y el
panel de resultados lo muestra siempre en un partido de playoff y lo deshabilita
cuando hay ganador. Unificarlas cambiaría la UI del admin y toca la escritura que
dispara el scoring, así que es una decisión de producto, no un refactor mecánico.

---

## Fase 7 — TypeScript: **terminada**

`src/` entero en TypeScript, **157 archivos**. El detalle está en
`docs/pruebas-fase-7.md`; acá queda lo que hace falta para seguir.

**Verificado en el navegador**: 19 rutas en los dos torneos, los dos temas, escritorio
y mobile, diffeando el árbol completo contra el estado anterior a la fase → **0
diferencias**. La única esperada apareció donde tenía que aparecer: en "Ver
pronósticos → por jugador", 15 tarjetas pasaron de `opacity: 0.6` a `1`, que es el
bug que el tipado encontró (se le pasaba el partido entero a `hasMatchStarted`, que
espera la fecha, así que la comparación daba siempre falso y **todas** las tarjetas
salían atenuadas).

Lo que el tipado sacó a la luz, resumido: un bug real, **cinco props que no hacían
nada**, **siete tipos escritos a mano que estaban mal** (los tres importantes:
`matches.is_finished`, `matches.tournament_id` y `rounds.tournament_id` son
nullables), y varios contratos que estaban implícitos y ahora están escritos.

### Lo que dejó para después

La fase 7 midió su propia deuda y la dejó agrupada en una fase nueva, la **10**:
las cuatro flags de `strict` que faltan (241 errores), los 48 tests que siguen en
`.js`, el hueco de tests de `SelectDropdown` y los renombres de convención que no se
unificaron. No están acá para no tener la misma lista en dos lugares.

### Las tres intenciones que se recuperaron (o no)

De las cinco props muertas, tres tenían una intención clara. Se resolvieron dentro de
la fase 7:

- **Emoji del torneo en el selector: aplicado.** Sale de
  `getTournamentConfig(tournament.slug)?.emoji` con la pelota como fallback. Medido:
  `⚽ ⚽ ⚽` → `🏆 🏆 🌍`.
- **Ancho del datepicker: aplicado**, con `.react-datepicker-wrapper { flex: 1 }` en
  `styles/datepicker-theme.css`. **Falta verlo en el navegador**: la única pantalla
  que lo usa es `/admin/horarios` y hace falta una sesión de admin.
- **Globito del suspendido: descartado.** `SUSPENDED_PLAYERS` son los mismos dos
  nombres que dos de los cinco grupos de `constants/hiddenPlayers`, y
  `useLeaderboard` filtra los ocultos en todas sus ramas: **ese bloque no se
  renderiza nunca**. Para que sirva hay que decidir antes si esos jugadores van
  ocultos o suspendidos, que es una decisión de producto.

---

## Fase 8 — UX y accesibilidad

**Revisado contra el código después de la fase 7.** Los números de abajo están
medidos, no heredados del plan original.

### Ya hecho

- ~~Focus trap y restauración de foco~~ → `hooks/useDialogBehavior.ts`, con tests,
  usado por `TournamentDrawer`. Incluye scroll-lock contado.
- ~~Inputs sin label asociado~~ → `Common/FormField` los une (8 `htmlFor` en 3
  archivos; el plan decía 11, ese número era de antes de que `FormField` los
  centralizara).
- ~~`className="btn btn-danger"` inexistente~~ → resuelto con `Common/Button`.
- ~~Contraste en ambos temas~~ → medido en la fase 5: de 62 y 36 textos por debajo
  del mínimo WCAG AA a **0**.
- ~~Navegación por flechas en los tabs~~ → `NavTabs` ya maneja `ArrowLeft`,
  `ArrowRight`, `Home` y `End`, y mueve el foco.
- **Las tres reglas de `jsx-a11y` que el ESLint tenía en `warn` como "deuda
  conocida" están en cero.** Lo que queda es lo que el linter no puede ver.

### Lo que queda

- **`Common/SelectDropdown`**, usado en ~10 pantallas. Tiene `aria-labelledby`,
  `aria-expanded` y `aria-haspopup="listbox"`, pero **le falta `role="listbox"` /
  `role="option"` y la navegación por flechas**. Es el ítem más grande de la fase.

  **Y no tiene un solo test.** Eso se descubrió en la fase 7: un error que se
  introdujo al migrarlo (una recursión infinita) lo atajó el lint, no los tests. Si
  se le va a reescribir el manejo de teclado, los tests van primero.

- **Formularios reales.** Solo `Login` y `UserProfile` usan `<form onSubmit>`.
  Pronósticos, resultados y bonus son inputs sueltos más un botón, así que no se
  puede enviar con Enter.

- **`loading="lazy"` + `width`/`height`**: hay 12 imágenes y **solo una las tiene**
  (`Common/TeamOption`). La de más impacto es `Common/TeamDisplay`, que se repite
  en cada fila de cada tabla: sin dimensiones, cada escudo que carga corre el
  layout.

- **Skeletons** en tabla de posiciones y pronósticos: hoy todo es spinner
  (`Common/LoadingState`, con tamaños nombrados, sirve de base) y hay layout shift.

- **Estados de error accionables.** Hoy el único botón de reintentar está en la
  tabla de posiciones (`LeaderBoard/ErrorMessage`) más el del `ErrorBoundary`. El
  resto de las pantallas muestra el texto del error y nada más, teniendo `refetch`
  disponible en todos los hooks.

- **Los dos `alt=""` de `Playoffs/PlayoffBracket`**: ahí el escudo es el único
  identificador visible del equipo, así que el alt vacío esconde información. (El
  `alt=""` de `TeamOption` sí está bien: el nombre va al lado.)

- **El `alt="Cerrar sesión"` de `MainMenuView`**: el ícono está pegado a un texto
  que dice lo mismo, así que un lector de pantalla lo anuncia dos veces. Va `alt=""`.

- Recorrer la app entera solo con teclado.

### Lo que hereda de las fases 6 y 7

- **`MatchManager/MatchResult/index.tsx`** (308 líneas, ~28 literales fuera de la
  escala de tokens). Se decidió no tocarlo en la fase 6 justamente porque esta fase
  lo iba a abrir: es el momento de normalizar sus tamaños de letra.
- **Verificar el ancho del datepicker en `/admin/horarios`.** La fase 7 lo arregló
  (`.react-datepicker-wrapper { flex: 1 }`) pero no pudo verlo: esa ruta necesita
  sesión de admin y la corrida se hizo con la cuenta de prueba.
- **La duplicación de la regla del clasificado por penales**: `MatchResult`
  reimplementa inline lo que `MatchPrediction/qualifier.ts` ya tiene con tests. No
  son idénticas —el formulario muestra el selector solo si hay empate, el panel lo
  muestra siempre y lo deshabilita—, así que unificarlas cambia la UI del admin.

---

## Fase 9 — Supabase (requiere migraciones en la base)

**La fase 7 cambió el punto de partida acá.** Ya no hay que adivinar el esquema: lo
genera Supabase en `src/types/database.ts` (`pnpm types:db`). De ahí salieron varias
respuestas y varios hallazgos nuevos.

### Lo urgente de verificar

- **RLS.** Sigue siendo lo más importante y **ninguna fase lo verificó**. Todo el
  control de admin es del lado del cliente: `AuthContext` chequea
  `profile?.role === 'admin'` y con eso **solo oculta UI**. Si las policies de
  `matches`, `rounds` y `predictions` no bloquean el write, cualquiera que fuerce
  `role` en memoria escribe en la base. Lo mismo con `isReadOnly` en torneos
  finalizados: es un guard de UI y nada más.

  **Pista nueva**: en la base existe una función `is_admin`, así que puede que las
  policies ya la usen. Hay que leerlas, no suponerlo.

- **Qué escribe `round_scores.total_points`.** Sigue sin confirmarse, pero ahora hay
  candidatos con nombre: la base tiene `calculate_points`, `recalculate_round`,
  `recalculate_round_scores` y `reset_round`. Leer sus cuerpos contesta la pregunta.

- **El cierre de pronósticos.** `PREDICTION_CUTOFF_MINUTES` es una convención de UI,
  y la base acepta la escritura igual. **Pista nueva**: existe una función
  `can_predict(match_id)`. Si ya implementa la regla, falta cablearla (o convertirla
  en trigger); si no, es el lugar donde ponerla.

### Deuda de esquema

- **`matches.tournament_id` y `rounds.tournament_id` son nullables.** Esto lo
  descubrió el esquema generado en la fase 7 y es lo más grave de la lista: es la
  columna de la que depende **toda** la separación entre torneos, y la regla
  "nunca consultar sin scope de torneo" se apoya en ella. Un partido o una fecha sin
  torneo no debería poder existir.
- **Los 15 argumentos de las RPC del bonus del Mundial** (`upsert_world_cup_prediction`
  y `admin_upsert_world_cup_official_results`) están declarados `text` no nullable,
  pero el cliente manda `null` para las preguntas sin responder. SQL lo acepta, así
  que hoy funciona; el tipo generado queda más estricto que la función real.
  Declararlos con `default null` **borra 24 de los 132 errores de
  `strictNullChecks`** de la fase 10.
- `rounds.status` tiene default `'closed'`, un valor que **no está en su propio
  CHECK** (`pending|open|locked|finished`), así que un INSERT sin `status` explícito
  falla. La fase 6 le puso un fallback en el cliente (`getRoundStatus`).
- **`matches.status` es columna muerta, confirmado**: el único "estado de partido"
  del cliente lo deriva `MatchStatusBadge` de `match_date` + `is_finished`. Nadie
  lee la columna. Elegir una y borrar la otra.
- **`matches.is_finished` es nullable**, y es el campo que decide qué fecha tiene
  tabla propia y qué partido entra en las estadísticas. Hoy un null se lee como
  falso en todos los usos, que es lo que se quiere, pero es una ausencia y no un
  "no terminó".
- Falta `tournament_id` en `predictions`: todo el scoping pasa por join con
  `matches` y por `.in('match_id', [...])` con listas largas.
- Cero índices documentados. Faltan casi seguro `matches(tournament_id, round_number)`
  y `round_scores(tournament_id, round_number)`. El esquema generado no los muestra,
  así que esto sigue siendo a verificar en la base.
- Vocabulario inconsistente: `rounds` usa `locked`, `matches` usa `closed` para lo
  mismo.
- ~~Verificar que `predictions.qualifier_prediction_id` tenga FK a `teams`~~ →
  **la tiene**: `predictions_qualifier_prediction_id_fkey`. Lo confirma el esquema
  generado.
- **Hay 4 vistas, no 1**: `general_leaderboard`, `general_leaderboard_by_tournament`,
  `leaderboard` y `round_leaderboard`. El cliente usa **solo la primera**, y en una
  rama que `App.jsx` prácticamente impide alcanzar (además, todas sus columnas son
  nullables, incluido el `id`). Hay tres vistas más para revisar y probablemente
  borrar.
- **Superficie muerta de pagos y finanzas: 4 tablas y 15 funciones.**
  `payments`, `payment_allocations`, `round_payments`, `round_finances` y sus RPC
  siguen en la base sin un solo consumidor desde que la fase 1 borró los paneles.
  `round_finances` tiene la PK sin `tournament_id`, así que dos torneos no pueden
  tener finanzas para la misma fecha. Si se retoma pagos, arrancar por ahí; si no,
  es candidato a borrar.

### Documentación del esquema

`docs/supabase-schema.md` es un snapshot a mano de agosto y **ahora compite con
`src/types/database.ts`, que se genera**. Conviene reducirlo a lo que el generador no
puede saber —RLS, triggers, cuerpos de las funciones, índices— y que para las
columnas apunte al archivo generado. Mantener dos fuentes es garantizar que una
mienta.

**Proceso:** adoptar el CLI de Supabase con migraciones versionadas en
`supabase/migrations/`. Si se corre `npx supabase init` para eso, ojo que crea la
carpeta `supabase/` en la raíz.

---

## Fase 10 — `strict` y tests

Fase nueva, y **sale de la fase 7**: no es un pendiente olvidado, es trabajo que se
midió al terminar de migrar y que no entra ni en UX ni en Supabase.

### `strict`, flag por flag

`strict` es un paraguas de ocho flags. La fase 7 prendió las cuatro que ya daban
cero. Las otras cuatro, medidas con `tsc --noEmit --<flag>`:

| Flag | Errores | Notas |
|---|---|---|
| `strictPropertyInitialization` | 1 | un rato |
| `useUnknownInCatchVariables` | 12 | mecánico: estrechar en los `catch` |
| `noImplicitAny` | 100 | callbacks y parámetros sin anotar |
| `strictNullChecks` | 132 | el grueso |

Prender `strict: true` de una son **241 errores juntos**, así que va flag por flag,
de menor a mayor. Las dos primeras (13 errores) se pueden hacer en cualquier
momento.

**Dependencia con la fase 9**: 24 de los 132 de `strictNullChecks` son un solo caso
—los argumentos de las RPC del bonus del Mundial declarados no nullables—, y se
arreglan **en la base**, no en el cliente. Conviene que la fase 9 pase primero, o al
menos ese punto.

Un dato para calibrar: cuando solo estaban migrados `utils/` y `lib/`,
`strictNullChecks` daba **0**. Esos módulos están escritos a la defensiva. Los 132
aparecieron con los hooks y los componentes.

### Los tests

Los **48 archivos de test siguen en `.js`**, y es a propósito: un fixture parcial
falla por propiedades faltantes, así que migrarlos es trabajo de fixtures y no de
tipos. Conviene hacerlo junto con `strictNullChecks`, con factories que armen
objetos completos.

También falta cubrir lo que la fase 7 dejó a la vista:

- **`Common/SelectDropdown` no tiene tests** y lo usan ~10 pantallas (ver fase 8).
- Los hooks de datos que no tienen test propio.

### Las convenciones que la fase 7 no unificó

Son renombres mecánicos, y conviene que vayan en un commit propio y no mezclados con
cambios de comportamiento:

- `LeaderBoard/LeadboardHeader/` — le falta la "er".
- `LeaderBoard` vs `LeaderboardRow` vs `useLeaderboard`: tres capitalizaciones del
  mismo nombre.
- `Navigation/Sidebar/Views/` — carpeta plural con un solo hijo, a 7 niveles.
- `TournamentSelector/TournamentCard.tsx` — archivo plano donde el resto usa
  `Componente/index.tsx`.
- `.gitignore` mantiene la excepción `!src/config/*.config.js`, que quedó vestigial:
  ese archivo ahora es `.ts`. No molesta, pero desorienta.

---

## Antes de mergear a main

1. Terminar las fases 8, 9 y 10, mergeando cada una a
   `refactor/fase-5-design-system` (la 6 y la 7 ya están).
2. **Revisar los cambios visuales juntos.** Están listados en
   `docs/pruebas-fase-6.md` (sección "Cambios visuales deliberados") y son los
   que motivaron la estrategia de ramas. Los de la fase 5 que quedaron señalados:
   texto secundario de `#757575` a `#666666`, títulos con el primario más oscuros,
   e ícono de estado vacío de 4rem a 3rem.
3. `pnpm lint && pnpm format:check && pnpm test && pnpm build`.
4. Probar con un torneo `active` y uno `finished`: `isReadOnly` cambia el
   comportamiento de 6 componentes.

## Cómo se verifica un refactor visual en este proyecto

Lo que funcionó en la fase 6, por si sirve de nuevo:

1. `git worktree add <tmp> <commit-anterior>` y una junction a `node_modules`
   (`New-Item -ItemType Junction`), para no reinstalar.
2. Un segundo `vite --port 5199` sobre ese worktree.
3. Playwright sobre los dos puertos, copiando el `localStorage` de un origen al
   otro para llevar la sesión.
4. Medir `getComputedStyle` de los nodos identificables por contenido —no por
   posición en el DOM, que cambia a propósito— y **diffear**. Incluir `margin`:
   olvidarlo escondió el único hallazgo real de la fase.
5. Cuando un diff parece implausible, **arreglar el medidor antes de creerle**.
   En la fase 6, 15 de 17 diferencias eran un selector que apuntaba a nodos
   distintos en cada versión.

## Torneos de prueba

No borrarlos: los slugs con prefijo `test-` son el mecanismo para probar contra la
base real sin tocar un torneo en curso, y solo los ven los admins.
