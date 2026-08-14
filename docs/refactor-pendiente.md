# Refactor: lo que queda (fases 7, 8 y 9)

Este documento existe para poder **arrancar una conversación nueva sin contexto
previo**. El plan original completo está en
`~/.claude/plans/te-animas-a-hacer-groovy-sutton.md` (fuera del repo), pero está
escrito contra el estado de hace 6 fases: varios de sus números y varios de sus
puntos ya no aplican. Acá está el estado **verificado** al cerrar la fase 6.

Registros por fase: `docs/pruebas-fase-3a.md`, `-3b`, `-4`, `-6`.

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

## Fase 7 — TypeScript gradual

El plan sigue vigente casi entero. Orden:

1. ~~`tsconfig.json` con `allowJs: true` y `strict: false`~~ → **hecho**, con dos
   cosas que el plan no preveía:
   - `@vitejs/plugin-react-swc` compila TS sin config, pero **no chequea tipos**:
     SWC borra las anotaciones sin mirarlas. Por eso se agregó `pnpm typecheck`
     (`tsc --noEmit`) y un paso propio en CI. Sin eso, la fase no daba seguridad
     ninguna.
   - **`typescript` quedó fijado en `^5.9`**: `pnpm add -D typescript` trae la 7.x
     (el compilador nativo nuevo) y `typescript-eslint` declara soporte hasta
     `<6.1.0`. Con la 7 el lint queda con un peer sin resolver.
2. ~~**`types/domain.ts` primero**~~ → **hecho**. Una interfaz por tabla más las
   uniones de los CHECK constraints, verificadas **contra la base** y no copiadas
   del snapshot. Incluye `MatchMeta` (el select compartido de `useMatchesMeta`) y
   `MatchWithTeams` (los tres joins de `MATCH_WITH_TEAMS`).
3. Considerar `supabase gen types typescript` para que los tipos de tablas dejen
   de desincronizarse con `docs/supabase-schema.md`, que se mantiene a mano.
   Necesita el CLI de Supabase y acceso al proyecto, así que va con la fase 9.
4. Orden de migración: `utils/` → `types/` → `lib/` → `hooks/` → `Common/` →
   features de menor a mayor.

   **`utils/` está terminado**: los 17 módulos, incluidos los 9 de `utils/stats/`.
   No queda ningún `.js` que no sea un test. Dos convenciones salieron de ahí:

   - Cada función pide **el subconjunto de columnas que usa**
     (`Pick<Match, 'home_team_id' | 'away_team_id'>`) y no la fila entera, así
     sirve igual para un registro de la base y para un objeto armado en un test.
   - Los tipos que no son filas de la base viven al lado de quien los produce:
     `utils/stats/types.ts` tiene el contrato de las estadísticas, que **hasta
     ahora era implícito** —lo definía el literal `emptyStats` y la pantalla leía
     `stats.metrics.totalPoints` de memoria—. Ahora `emptyStats` está anotado con
     `TournamentStats`, así que si el contrato gana un campo el literal deja de
     compilar hasta que se lo agregue.

   **Los tests siguen en `.js`**: con `strict: false` un fixture parcial igual
   falla por propiedades faltantes, así que migrarlos ahora sería pelear con los
   tipos en vez de migrar código.

   Lo que TypeScript encontró en esta primera pasada, sin buscarlo:

   - `secondsUntilCutoff` restaba dos `Date` directamente, que en TS es error.
   - **`getLeaderboardRounds` pisa el `id` de la fila** (un uuid) con el
     `round_number` (un número), así que `Round & { id: number }` es imposible de
     tipar y quedó como `Omit<Round, 'id'> & { id: number }`. Es intencional —`id`
     es la clave del dropdown, y las dos opciones sintéticas del selector
     (`General` y `playoffs`) también la traen— pero duplica exactamente a
     `round_number`: el dropdown podría usar `valueKey="round_number"` y la línea
     desaparecería. Queda como candidato porque toca `LeadboardHeader`.
   - `MatchWithTeams.home_team` / `away_team` se tiparon **nullable** aunque los
     405 partidos de la base tengan las dos FK cargadas: `teamReads` solo cuenta el
     partido si están los dos, y el dominio admite un cruce de playoff sin equipos
     todavía. Si el embed no trae la fila, PostgREST devuelve null.
   **`lib/` está terminado** también: `supabase.ts`, `queryClient.ts` y
   `queryKeys.ts`. Dos cosas salieron de ahí:

   - **`src/vite-env.d.ts` declara las variables de entorno**, que hasta ahora eran
     `any`. Van opcionales a propósito: pueden faltar, y todo el mecanismo de
     `missingSupabaseEnvVars` + `Common/ConfigError` existe para avisarlo en
     pantalla. Con el `?` el chequeo de faltantes también le dice algo al compilador.
   - `missingSupabaseEnvVars` usaba `.filter(Boolean)`, que **TypeScript no
     estrecha**: el tipo seguía siendo `(string | null)[]` y un null podía llegar al
     consumidor. Ahora el filtro lleva un predicado (`name is string`).
   - En `queryKeys` la fecha de la tabla de posiciones quedó tipada como
     `number | 'playoffs' | null`, que es lo que de verdad recibe: `null` es la
     tabla general y `'playoffs'` la agregada de la llave.

5. Renombrar los **`.jsx` que no contienen JSX** a `.ts`. Quedan **17**:
   `src/lib/supabase.jsx` ya se migró en el punto anterior.

   ```
   src/hooks/useAllPredictions.jsx      src/hooks/usePersonalStats.jsx
   src/hooks/useDialogBehavior.jsx      src/hooks/usePlayoffs.jsx
   src/hooks/useHomePath.jsx            src/hooks/usePredictions.jsx
   src/hooks/useLeaderboard.jsx         src/hooks/useResetCooldown.jsx
   src/hooks/useMatches.jsx             src/hooks/useRoundProgress.jsx
   src/hooks/useMatchesMeta.jsx         src/hooks/useRounds.jsx
                                        src/hooks/useWorldCupBonus.jsx
   src/components/InfoPage/info.config.jsx
   src/components/LeaderBoard/leaderboard.config.jsx
   src/components/Navigation/Sidebar/menu.config.jsx
   src/hooks/useResetCooldown.test.jsx
   ```

   Ojo: `pages-with-sections.config.jsx` **sí** tiene JSX (iconos), no entra.
6. Subir a `strict: true` cuando no queden `.jsx`.

**Convenciones a unificar mientras se migra** (verificado, sigue vigente):

- **Un solo estilo de export.** 81 componentes usan `export default`; **14** usan
  solo named export (son los de `PersonalStats/**`).
- Un solo patrón de carpeta `Componente/index.tsx`. Todavía conviven archivos
  planos, p. ej. `TournamentSelector/TournamentCard.jsx`.
- Typos: `LeaderBoard/LeadboardHeader/` (falta la "er"). Y `LeaderBoard` vs
  `LeaderboardRow` vs `useLeaderboard`: tres capitalizaciones del mismo nombre.
- `Navigation/Sidebar/Views/` es una carpeta plural con un solo hijo, a 7 niveles.

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

1. Terminar las fases 7 y 8, mergeando cada una a
   `refactor/fase-5-design-system`.
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
