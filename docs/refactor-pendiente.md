# Refactor: lo que queda (fases 8 y 9)

Este documento existe para poder **arrancar una conversación nueva sin contexto
previo**. El plan original completo está en
`~/.claude/plans/te-animas-a-hacer-groovy-sutton.md` (fuera del repo), pero está
escrito contra el estado de hace 6 fases: varios de sus números y varios de sus
puntos ya no aplican. Acá está el estado **verificado** al cerrar la fase 6.

Registros por fase: `docs/pruebas-fase-3a.md`, `-3b`, `-4`, `-6`, `-7`.

---

## Estado al cerrar la fase 6

Rama actual: `refactor/fase-6-god-components`, sale de
`refactor/fase-5-design-system`.

**Estrategia de ramas acordada:** las fases 6, 7 y 8 se mergean a la rama de la
fase 5, y esa es la que va a `main`. El motivo es que la fase 5 dejó cambios
visuales chicos que hay que revisar juntos al final, antes de mergear. Cada fase
nace de `refactor/fase-5-design-system` y vuelve ahí al terminar.

`main` no tiene ningún commit que la fase 5 no tenga, así que no hay divergencia.

Métricas verificadas:

| | Valor |
|---|---|
| Tests | 414 en 48 archivos |
| Archivos > 250 líneas | 7 (era 12 al empezar la fase 6) |
| Imports de Supabase en componentes | 0 |
| `useEffect` de fetching en hooks | 0 |
| `.jsx` que no contienen JSX | 18 |

`pnpm lint && pnpm format:check && pnpm test && pnpm build` en verde.

**La fase 6 está cerrada y verificada.** El último punto era
`PredictionForm/index.jsx` (429 → 223 líneas), con el detalle en
`docs/pruebas-fase-6.md`: el diff de estilos computados dio **0 diferencias en las
9 combinaciones** medidas (dos torneos, los dos temas, 1280 y 390px, la fecha sin
partidos, ida y vuelta de fecha y la barra sticky), comparando todos los nodos del
árbol y no solo unas sondas. Y se probó **guardar de verdad** en `test-sandbox`,
con verificación contra la base: upsert sin filas duplicadas, el clasificado por
penales en sus dos ramas y ningún partido tocado fuera del payload. Con eso quedan
cerrados los dos pendientes de verificación que arrastraba la fase (la escritura
real y el `QualifierPicker` en el navegador).

### `MatchManager/MatchResult/index.jsx`: se decidió no tocarlo

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

### Lo que queda como deuda, medido

**`strict` está a medio prender.** De sus ocho flags, cuatro ya estaban en cero y se
prendieron; las otras cuatro son:

| Flag | Errores |
|---|---|
| `strictPropertyInitialization` | 1 |
| `useUnknownInCatchVariables` | 12 |
| `noImplicitAny` | 100 |
| `strictNullChecks` | 132 |

De una sola vez son 241 errores; conviene ir flag por flag empezando por las dos
chicas. De los 132 de `strictNullChecks`, **24 son un solo caso repetido**: las RPC
del bonus del Mundial declaran sus 15 argumentos como `string` no nullable y el
cliente manda `null` para las preguntas sin responder. El tipo generado es más
estricto que la función real; se arregla en la base (fase 9), no en el cliente.

**Los tests siguen en `.js`**, y conviene migrarlos junto con `strictNullChecks`: es
trabajo de fixtures, no de tipos.

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

### Convenciones: lo que se unificó y lo que no

- ~~Un solo estilo de export~~ → **hecho**: los 10 componentes de `PersonalStats`
  pasaron de named a default, que es lo que usa el resto del proyecto.
- Sigue pendiente: el patrón de carpeta (`TournamentSelector/TournamentCard.tsx` es
  un archivo plano), los typos (`LeaderBoard/LeadboardHeader/`, y `LeaderBoard` vs
  `LeaderboardRow` vs `useLeaderboard`), y `Navigation/Sidebar/Views/`, una carpeta
  plural con un solo hijo a 7 niveles.

### Un hueco de tests que apareció migrando

`Common/SelectDropdown` **no tiene un solo test** y lo usan ~10 pantallas. Se notó
porque un error que introduje al migrarlo (una recursión infinita) lo atajó el lint
—por una variable sin usar— y no los tests. La fase 8 lo va a tocar igual, porque le
falta `role="listbox"` y navegación por flechas.

---

## Fase 8 — UX y accesibilidad

**El plan está desactualizado acá: las fases 5 y 6 ya resolvieron cuatro de sus
puntos.** Estado verificado:

### Ya hecho

- ~~Focus trap y restauración de foco~~ → `hooks/useDialogBehavior.jsx`, con
  tests, usado por `TournamentDrawer`. Incluye scroll-lock contado.
- ~~Inputs sin label asociado~~ → `Common/FormField` los une; hay 11 `htmlFor`.
- ~~`className="btn btn-danger"` inexistente~~ → resuelto con `Common/Button`.
- ~~Contraste en ambos temas~~ → medido en la fase 5: de 62 y 36 textos por
  debajo del mínimo WCAG AA a **0**, en Mundial y en verde, claro y oscuro. Los
  tokens `--color-*-text` existen para eso.

### Lo que queda

- **`Common/SelectDropdown`**, usado en ~10 lugares. Ya tiene `aria-labelledby`,
  `aria-expanded` y `aria-haspopup="listbox"` (fase 5), pero **le falta
  `role="listbox"` / `role="option"` y la navegación por flechas**. El comentario
  del archivo lo dice explícitamente y apunta a esta fase.
- **Formularios reales.** Solo `Login` y `UserProfile` usan `<form onSubmit>`.
  Pronósticos, resultados y bonus son inputs sueltos más un botón, así que no se
  puede enviar con Enter.
- **`loading="lazy"` + `width`/`height`**: las **12** imágenes del proyecto no lo
  tienen (verificado). Sobre todo los escudos de `Common/TeamDisplay`, que se
  repiten en cada fila de cada tabla.
- **Skeletons** en tabla de posiciones y pronósticos: hoy todo es spinner y hay
  layout shift. Ya existe `Common/LoadingState` con tamaños nombrados como base.
- **Estados de error accionables**: mensaje claro más botón de reintentar,
  aprovechando que React Query ya expone `refetch` e `isError`.
- **Los `alt=""` de `Playoffs/PlayoffBracket`**: ahí el escudo es el único
  identificador visible del equipo, así que el alt vacío esconde información.
- Recorrer la app entera solo con teclado.

---

## Fase 9 — Supabase (requiere migraciones en la base)

No hay SQL versionado en el repo, solo el snapshot manual de
`docs/supabase-schema.md`, que no cubre RLS ni triggers. Sin cambios respecto del
plan original.

### Lo urgente de verificar

- **RLS.** Todo el control de admin es del lado del cliente:
  `AuthContext` chequea `profile?.role === 'admin'` y con eso **solo oculta UI**.
  Si las policies de `matches`, `rounds` y `predictions` no bloquean el write,
  cualquiera que fuerce `role` en memoria escribe en la base. Lo mismo con
  `isReadOnly` en torneos finalizados: es un guard de UI y nada más. **Ninguna
  fase del refactor verificó esto**, y se anotó como pendiente en todas.
- **Qué escribe `round_scores.total_points`.** Es el dato del que depende toda la
  tabla de posiciones y el propio doc del esquema admite que no se sabe si lo
  calcula un trigger o una RPC.
- **El cierre de pronósticos no tiene trigger.** `PREDICTION_CUTOFF_MINUTES` es
  una convención de UI: la base acepta la escritura igual.

### Deuda de esquema

- `rounds.status` tiene default `'closed'`, un valor que **no está en su propio
  CHECK** (`pending|open|locked|finished`), así que un INSERT sin `status`
  explícito falla. La fase 6 le puso un fallback en el cliente
  (`getRoundStatus`), pero el problema está en la base.
- `matches.status` es columna muerta: el cliente usa solo `is_finished`. Elegir
  una y borrar la otra. Igual con `rounds.status`, que compite con
  `getNextActiveRoundNumber()` derivando la fecha activa desde `match_date`.
- Falta `tournament_id` en `predictions`: todo el scoping pasa por join con
  `matches` y por `.in('match_id', [...])` con listas largas.
- Cero índices documentados. Faltan casi seguro
  `matches(tournament_id, round_number)` y
  `round_scores(tournament_id, round_number)`.
- Vocabulario inconsistente: `rounds` usa `locked`, `matches` usa `closed` para lo
  mismo.
- Verificar que `predictions.qualifier_prediction_id` tenga FK a `teams`.
- `general_leaderboard` es una vista sin scope de torneo, usada en una rama que
  `App.jsx` prácticamente impide alcanzar. Probablemente borrable.
- **Fuera de alcance**: `round_finances` (PK sin `tournament_id`) y
  `round_payments` (sin `tournament_id`). La fase 1 borró sus consumidores. Si
  algún día se retoma pagos, arrancar por ahí.

**Proceso:** adoptar el CLI de Supabase con migraciones versionadas en
`supabase/migrations/`, para que el esquema deje de ser un documento a mano.

---

## Antes de mergear a main

1. Terminar la fase 8 y mergearla a `refactor/fase-5-design-system` (la 7 ya está).
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
