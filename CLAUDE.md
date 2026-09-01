# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comandos

Package manager: **pnpm** (hay `pnpm-lock.yaml` y `pnpm-workspace.yaml`). Node 22.x.

```bash
pnpm dev            # Vite dev server
pnpm build          # build de producción a dist/
pnpm preview        # servir el build
pnpm test           # vitest run
pnpm test:watch
pnpm test:coverage
pnpm lint           # eslint src
pnpm lint:fix
pnpm typecheck      # tsc --noEmit
pnpm types:db       # regenera src/types/database.ts desde Supabase (pide supabase login)
pnpm format         # prettier --write sobre src/
pnpm format:check
```

**Testing**: Vitest + Testing Library + jsdom. Config en `vitest.config.js`, setup en `src/test/setup.js` (importa `jest-dom` y hace `cleanup()` después de cada test). Los tests van al lado del archivo que prueban (`matchTiming.ts` → `matchTiming.test.js`).

Para testear un hook de datos: `src/test/supabaseMock.js` arma un mock del query builder encadenable de Supabase y cuenta consultas por tabla (útil para verificar que el cache deduplica). Ver `useRounds.test.jsx` como referencia — hay que mockear `../lib/supabase` con un getter y envolver el `renderHook` en un `QueryClientProvider` con `retry: false`.

CI en `.github/workflows/ci.yml`: corre `lint`, `typecheck`, `format:check`, `test` y `build` en cada push a `main` y en cada PR.

## TypeScript (fase 7, terminada)

**`src/` está entero en TypeScript**: 160 archivos. Los únicos `.js` que quedan son
los tests y sus dos helpers (`src/test/`).

- **`pnpm build` no chequea tipos.** El build lo hace SWC, que borra las anotaciones sin mirarlas, así que **el único chequeo real es `pnpm typecheck`** (`tsc --noEmit`). Está en CI como paso propio; si se saca, un error de tipos llega a producción en verde.
- `tsconfig.json` mantiene `allowJs: true` y `checkJs: false` por los tests, que siguen en `.js`. `types: ["vite/client"]` es lo que tipa `import.meta.env` y los imports de `*.module.css`.
- **`strict` está a medio camino, y a propósito.** Es un paraguas de ocho flags: cuatro (`strictFunctionTypes`, `strictBindCallApply`, `noImplicitThis`, `alwaysStrict`) ya están prendidas porque daban cero errores. Las otras cuatro son deuda medida: `strictNullChecks` 123, `noImplicitAny` 100, `useUnknownInCatchVariables` 12, `strictPropertyInitialization` 1. Conviene ir flag por flag, no prender `strict: true` de una (236 errores juntos). Las dos últimas son 13 errores entre las dos: son la puerta de entrada. Y `strictNullChecks` bajó de 132 a 123 durante la fase 8 sin que nadie lo buscara, porque las guardas que esa flag pide son las mismas que pide escribir código defensivo: parte de la deuda se cae sola al tocar los archivos por otra razón.
- **`typescript` está fijado en `^5.9` a propósito.** `pnpm add -D typescript` instala la 7.x (el compilador nativo nuevo) y `typescript-eslint` declara soporte hasta `<6.1.0`: con la 7 el lint queda con un peer sin resolver. Subir recién cuando typescript-eslint la soporte.
- **`src/types/database.ts` es la verdad y lo genera Supabase** (`pnpm types:db`): no se edita a mano. Está en `.prettierignore` y en los `ignores` de ESLint, porque reformatearlo haría que cada regeneración traiga un diff de formato encima del diff real del esquema.
- **`src/types/domain.ts` le pone los nombres del dominio** (`Match = Tables<'matches'>`) y guarda lo que el generador no puede saber: qué columna está muerta, cuál es el default roto, qué garantiza el cliente. Antes eran interfaces a mano y **varias estaban mal** (ver el registro de la fase 7): escribir tipos a mano es afirmar, no comprobar.
- Las uniones de estado (`TournamentStatus`, `RoundStatus`, …) siguen a mano y **no son el tipo de la columna**: los estados son `text` + CHECK y no enums de Postgres, así que el esquema generado los da como `string | null` (`Enums` viene vacío). Sirven para comparar y estrechar.
- El cliente es `createClient<Database>()`, así que `.from(...).select(...)` devuelve el tipo real, incluidos los embeds con alias. Las RPCs también quedan tipadas.
- Las funciones piden **el subconjunto de columnas que usan** (`Pick<Match, 'home_team_id' | 'away_team_id'>`) en vez de la fila entera: así sirven igual para un registro de la base y para un objeto armado en un test.
- **Los tests siguen en `.js`.** Un fixture parcial falla por propiedades faltantes, así que migrarlos es un trabajo de fixtures y no de tipos. Van con las flags de `strict` que faltan.
- **Los tipos de los componentes se importan de donde viven los datos**, no se redeclaran: las props de una pantalla de estadísticas salen de `utils/stats`, las de una fila de la tabla de `hooks/useLeaderboard`, las del bracket de `hooks/usePlayoffs`. Si un hook cambia su forma, la pantalla deja de compilar.
- ESLint aplica las reglas del proyecto (`no-console`, `import-x`, a11y, prettier) también a `.ts`/`.tsx`, más un bloque de `typescript-eslint` al final que apaga las reglas core que se pisan con las suyas.

Prettier corre **como regla de ESLint** (`prettier/prettier: error`), así que `pnpm lint` falla por problemas de formato. Config: sin punto y coma, comillas simples, `printWidth: 100`, `arrowParens: avoid`.

`.gitignore` ignora `*.config.js` en la raíz, con excepciones explícitas para `src/config/*.config.js`, `eslint.config.js`, `vite.config.js` y `vitest.config.js`. **Un `*.config.js` nuevo en la raíz no se agrega solo: hay que sumarle su propia excepción.**

## Variables de entorno

En `.env` (no versionado), prefijo `VITE_`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY` — ojo: **no** es `VITE_SUPABASE_ANON_KEY`
- `VITE_ALLOW_UPCOMING_TOURNAMENTS_FOR_ADMINS` — si es `'true'`, los admins también pueden entrar a torneos con status `upcoming`

`.env.example` tiene la lista completa con comentarios.

`src/lib/supabase.ts` **no** debe tirar si faltan las variables: `createClient` se ejecuta al evaluar el módulo, o sea antes de que React monte, así que un throw ahí deja la pantalla en blanco sin mensaje (ni el `ErrorBoundary` llega a existir). En su lugar construye el cliente con placeholders y exporta `missingSupabaseEnvVars`; `App.jsx` lo chequea antes de los providers y renderiza `Common/ConfigError`. En Vercel las variables se configuran por entorno: Production, Preview y Development son listas separadas.

Deploy en Vercel; `vercel.json` reescribe todo a `/index.html` (SPA) y define los headers de seguridad. La CSP incluye `style-src 'unsafe-inline'` porque la app todavía usa cientos de estilos inline y bloques `<style>` inyectados; se puede endurecer cuando eso se migre.

## Arquitectura

React 19 + Vite (SWC) + Supabase. Sin router, sin librería de estado, sin CSS framework. Español en UI, comentarios y mensajes de commit.

### Composición de providers y gating (`src/App.jsx`)

`ErrorBoundary` → `ThemeProvider` → `TournamentProvider` → `AuthProvider` → `AppContent`. El gating es en cascada y determina qué se renderiza:

1. Sin `user` → `<Login />`
2. Ruta `/profile` → `<Navigation />` (única vista que no exige torneo activo)
3. Con user pero sin `activeTournament` → `<TournamentSelector />`
4. Con torneo accesible → `<Navigation />`

Son accesibles los torneos con `status === 'active'` y `'finished'` (más `upcoming` para admins si el flag de entorno está activo). Hay un guard con `useEffect` que limpia el torneo si alguien fuerza uno bloqueado vía localStorage.

**Torneos de prueba** (`src/utils/tournamentAccess.ts`): los que tienen slug con prefijo `test-` solo son accesibles y visibles para admins. Se distinguen por slug y no por `status` a propósito — quedan en `active`, o sea escribibles, porque cualquier otro status los volvería `isReadOnly` e inservibles para probar. El filtro se aplica en `App.jsx` (acceso + lista del selector) y en `Sidebar` (contador de "Cambiar torneo"). No hay entorno de desarrollo separado: es el mecanismo para probar contra la base real sin tocar un torneo en curso.

**Modo consulta**: `TournamentContext` expone `isReadOnly` (`activeTournament.status !== 'active'`). Es la única definición de "torneo cerrado a escrituras" y la consumen `PredictionForm`, `MatchPrediction`, `WorldCupPredictions`, `Sidebar` (oculta administración), `NavHeader` (badge 🏁) y `Navigation` (entra por la tabla de posiciones en vez del formulario). Cualquier escritura nueva tiene que respetarlo — el gating por status no vive en ningún otro lado. Son guards de UI; qué hace RLS con esas escrituras no está verificado.

### Multi-torneo: el eje central del código

`TournamentContext` guarda el torneo activo, lo persiste en `localStorage` (`active_tournament_slug`) y aplica su tema. **Casi todo hook de datos recibe `activeTournament?.id` y filtra por `tournament_id`.** Al agregar features nuevas, seguir ese patrón o los datos se mezclan entre torneos.

Existen dos ejes de variación por torneo:

- **Tema visual**: `src/config/tournaments.config.js` mapea `slug` → paletas CSS (light/dark) que se inyectan como custom properties en `document.documentElement` y setean `data-tournament`. Las claves deben coincidir con `tournament.slug` en Supabase. Un slug nuevo en la DB sin entrada acá se renderiza con la paleta base de `src/index.css`.
- **Reglas de negocio**: chequeos ad-hoc de slug, sobre todo `slug === 'mundial-2026'` (secciones mundialistas en `Navigation`, colores de grupo en `utils/groupBadgeStyles.ts`, criterios de desempate en `InfoPage/info.config.jsx`).

`ThemeContext` (dark/light) y el tema del torneo están acoplados: al togglear el tema se re-aplica `applyTournamentTheme` leyendo el slug desde localStorage.

### Navegación (React Router)

**`src/components/Navigation/pages-with-sections.config.jsx` es la fuente única**: cada sección declara su `id`, su `label` y su **`path`**, y de ahí salen tanto los tabs como el mapa de rutas. Hay tests que verifican que no se desincronicen.

- `src/routes.jsx` — tabla de rutas. Todas las vistas son `React.lazy`, envueltas en `<Page>` (`ErrorBoundary` + `Suspense`): `Suspense` cubre la carga pero **no** los errores, así que sin el boundary un chunk que falla (deploy nuevo con la pestaña vieja abierta) deja la pantalla en blanco.
- Dos guards: `AdminRoute` (rol **y** torneo no finalizado) y `MundialRoute`. Cuando no corresponde, **redirigen** — antes devolvían `null`, o sea una pantalla en blanco.
- `src/components/Navigation/index.jsx` es solo el shell: header, tabs y área de contenido. Deriva la vista y la sección activas de la URL con `resolveRoute`; no tiene estado de navegación propio. Filtra dos tabs: las secciones mundialistas (`MUNDIAL_ONLY_SECTIONS`) y la llave de playoffs, que se muestra solo si el torneo tiene partidos con `is_playoff`. Las rutas siguen existiendo igual, así que un link viejo no se rompe: cae en la pantalla vacía de la vista.
- Navegación global vía menú hamburguesa → `Sidebar/menu.config.jsx` (`MENU_ITEMS`, con `viewType`: `tournament`, `info`, `stats`, `profile`, `admin`). Cada `viewType` resuelve su path con `getViewDefaultPath`.
- `useHomePath()` decide a dónde lleva `/`: la tabla de posiciones en un torneo finalizado, los pronósticos en uno activo.

Rutas: `/pronosticos`, `/mundialistas`, `/rivales`, `/posiciones`, `/playoffs`, `/reglas/:seccion`, `/estadisticas`, `/perfil`, `/admin/{partidos,fechas,horarios,mundial}`.

**Nunca usar `window.history` ni `window.location` para navegar**: cambia la URL sin avisarle al router, que sigue mostrando la ruta anterior. Usar `useNavigate`. El link del mail de recuperación de contraseña se arma con `PROFILE_PATH` por el mismo motivo.

Para agregar una pantalla: entrada en `MENU_ITEMS` (si es de nivel superior) o en las `*_SECTIONS` correspondientes **con su `path`**, más su `<Route>` en `routes.jsx`.

### Capa de datos

`src/lib/supabase.ts` exporta un único cliente. Toda la lógica de datos vive en `src/hooks/use*.jsx`. La única lectura que queda fuera de un hook es la RPC de progreso de jugadores en `RoundManager`.

**TanStack Query**: todos los hooks de datos están migrados. Ya no queda ningún `useEffect` de fetching en `src/hooks/`.

- Cliente y defaults en `src/lib/queryClient.ts` (`staleTime` 30s, `retry` 1 en lecturas y **0 en mutaciones**, porque reintentar una escritura duplicaría un pronóstico).
- **Las query keys se arman siempre con `src/lib/queryKeys.ts` y empiezan por el id del torneo.** Es lo que impide que el cache mezcle torneos, igual que el filtro `tournament_id` en las queries. Nunca escribir un array de key a mano.
- `useMatchesMeta` es la consulta compartida de "todos los partidos del torneo" (`id, round_number, match_date, is_finished, is_playoff`). Su select es un superconjunto a propósito: la usan `useRounds`, `MatchManager`, `RoundManager`, `LeaderBoard` y `Navigation`. Si necesitás otra columna de esa lista, agregala ahí en vez de crear una query nueva. Sin `tournamentId` la query queda deshabilitada (`enabled`), porque traer los partidos de todos los torneos no sirve para nada.
- Las mutaciones invalidan en vez de parchear estado local, y conservan el contrato `{ data, error }` que ya usan los componentes.
- Las devtools están disponibles en `pnpm dev` (botón abajo a la izquierda); son la forma de verificar que no haya queries duplicadas.
- **Los hooks devuelven referencias estables.** `data ?? []` crea un array nuevo en cada render, y un consumidor que lo use como dependencia de un efecto que setea estado entra en bucle (`Maximum update depth exceeded`). Fue el bug de `/admin/horarios`. Envolver siempre en `useMemo` (`useMatches`, `useMatchesMeta`, `usePredictions`, `usePlayoffs`, `useLeaderboard`, `useAllPredictions`) o usar una constante a nivel de módulo (`EMPTY_DATA` en `useWorldCupBonus`, `EMPTY_MAP` en `useAllPredictions`). Hay un test de esto en `useMatches.test.jsx`.
- Cuándo pedir datos se expresa con `enabled`, no con un `if` adentro de un efecto. Si `enabled` es `false`, `isPending` queda en `true` para siempre: por eso los hooks devuelven `loading` combinado con la misma condición (ver `useMatches`, `usePredictions`).
- `useLeaderboard` exporta `fetchLeaderboardData` aparte del hook: la lógica de ramas (general / por fecha / playoffs / con bonus) vive en una función suelta para que se pueda testear sin montar React.

Los `value` de `TournamentContext` y `ThemeContext` van con `useMemo` y sus funciones con `useCallback`. `TournamentContext` lo consumen ~15 componentes: un objeto nuevo por render re-renderiza el árbol entero.

Tablas/vistas: `tournaments`, `rounds`, `matches`, `teams`, `predictions`, `profiles`, `round_scores`, `general_leaderboard` (vista), `world_cup_*` (`teams`, `predictions`, `bonus_config`, `bonus_scores`, `official_results`).

RPCs que usa el cliente: `get_personal_stats`, `get_tournament_leaderboard_with_bonus`, `get_round_predictions_summary_by_tournament[_v2]` (**la variante sin scope no existe en la base**: lo confirma el esquema generado), `upsert_world_cup_prediction`, `admin_set_world_cup_lock`, `admin_lock_world_cup_predictions`, `recalculate_world_cup_bonus`.

En Supabase existen además las RPCs de pagos y finanzas (`get_round_payments_status`, `register_payment`, `remove_round_allocation`, `upsert_round_finance`, `get_all_round_financial_summaries`, con sus variantes `_by_tournament`), pero **ya no las llama nadie**: los paneles que las usaban se borraron por no estar cableados.

**Nunca consultar sin scope de torneo.** Los `round_number` se repiten entre torneos, así que una query a `round_scores` sin `tournament_id` no devuelve un error: devuelve datos de otros torneos mezclados. Existía un patrón de fallback que ante un error en la query scopeada reintentaba sin el filtro — se eliminó, porque degradaba en silencio a datos incorrectos. Si la consulta con scope falla, propagar el error.

`RoundManager` todavía prueba dos RPC con scope en orden (`_by_tournament_v2` y `_by_tournament`) porque no todas las bases tienen la primera; eso es aceptable, las dos filtran por torneo. Lo que no se hace más es caer a la variante sin scope.

**Ordenamiento de tablas**: `src/utils/ranking.ts` (`compareByPoints`, `assignPositions`) es la única forma de ordenar un ranking. Lo usan `useLeaderboard` y las dos agregaciones de `usePersonalStats`. Si una pantalla nueva ordena por su cuenta, va a mostrar posiciones distintas ante empates.

El scoring **no se calcula en el cliente**: los puntos llegan de `round_scores` / RPCs (triggers o funciones en Supabase). No hay migraciones ni SQL en este repo, pero sí un snapshot del esquema en `docs/supabase-schema.md` (tablas, CHECK constraints y qué valores acepta cada campo de estado). No incluye RLS ni triggers.

### Reglas de dominio en el cliente

- `src/utils/matchTiming.ts` — fuente única de verdad de tiempos: `PREDICTION_CUTOFF_MINUTES = 10` (cierre de pronósticos), `RESULT_LOAD_DELAY_HOURS = 2` (cuándo el admin puede cargar el resultado), y `getNextActiveRoundNumber()`, que deriva la fecha activa desde los `match_date` (no desde `round.status`). Usar `canPredictMatch()` antes de habilitar cualquier input de pronóstico, y `getResultLoadTime()` para mostrar el horario — no recalcular el delay a mano, o el texto termina mintiendo cuando cambia la constante.
- `src/constants/hiddenPlayers.js` — `filterHiddenPlayers()` oculta jugadores por coincidencia de nombre normalizado. Se aplica en `useLeaderboard`, `useAllPredictions`, `RoundManager` y `usePersonalStats` (este último con `isHiddenPlayer` sobre el perfil embebido, y sin filtrar nunca al usuario propio). **Si agregás una vista con listas de usuarios, aplicalo también**: si un consumidor se lo saltea, los totales dejan de coincidir entre pantallas.
- `PREDICTION_CUTOFF_MINUTES` vive solo en `utils/matchTiming.ts` (se borró la copia de `constants/predictions.js`). No volver a duplicarla.
- `src/utils/leaderboardRounds.ts` — qué fechas tienen tabla propia en la tabla de posiciones y si el torneo tiene playoffs. **El criterio sale de los partidos, no de `rounds.status`**: una fecha aparece cuando tiene al menos un partido `is_finished`, y las de playoff se detectan por `is_playoff` en vez de por un rango fijo. `rounds.status` se actualiza a mano desde el panel de fechas y queda desincronizado (Clausura 2026 tiene la fecha 4 jugada entera y en `open`; en el Mundial las de playoff siguen en `pending`), así que filtrar por status hacía desaparecer fechas ya jugadas. Lo consumen `LeaderBoard` (opciones del selector) y `Navigation` (mostrar u ocultar el tab de la llave). `WORLD_CUP_STANDALONE_ROUNDS = {4, 5}` es la única excepción hardcodeada y **solo aplica al Mundial**: ahí 16avos y octavos tienen tabla propia y el resto se agrega en "Cuartos a Final".
- `src/constants/worldCupBonus.js` — preguntas bonus del Mundial con sus puntos (`WORLD_CUP_BONUS_MAX_POINTS = 50`) y el mapa slug → código de país para las banderas de flagcdn.
- Sistema de puntos y desempates (texto que ve el usuario): `src/components/InfoPage/info.config.jsx`. El README ya no repite el esquema: apunta acá, que es la única fuente.

### Estilos

Tres mecanismos conviven: `*.module.css` por componente (lo preferido en código nuevo), estilos inline en JSX (muy común en los componentes viejos y grandes) y bloques `<style>` embebidos (`Navigation` inyecta sus media queries así). Siempre usar las custom properties `--color-*` en vez de hex literales, para que los temas por torneo funcionen. Mobile-first.

Las escalas de espaciado, radio, tipografía y capas viven en `src/styles/tokens.css`, y **cada una sale de contar los valores reales del código, no de una plantilla**. Dos valores quedaron afuera a propósito y conviene saberlo antes de "normalizar" algo: `10px` (al migrar cae en `sm` o en `md` según el caso, así que exige mirar la pantalla) y todo lo que no coincida exacto con un paso de la escala. Cuando un literal no tiene token exacto, se deja como literal **con el motivo escrito al lado** en vez de redondearlo: reemplazarlo es un cambio visual, no un refactor. Los seis que quedan así en `MatchManager/MatchResult` son el ejemplo.

### Accesibilidad (fase 8, terminada)

- **`Common/FormField` es la forma de asociar una etiqueta con un control**: genera el `id` con `useId` y lo inyecta, así que no se puede olvidar. Tiene un modo `group` (`role="group"` + `aria-labelledby`) que **solo va cuando hay varios controles bajo una etiqueta** —una fecha y una hora—; con un control solo, usarlo deja al control sin nombre y nombra al grupo. Ese error estaba en `AdminWorldCupBonus`.
- **`Common/SelectDropdown` no es un `<select>`**, así que un `<label htmlFor>` no tiene a qué apuntar: se nombra con su prop `label`, que acepta un `ReactNode`. Es un `role="listbox"` con `role="option"` y teclado completo (flechas, `Home`/`End`, `Escape` que devuelve el foco, `Tab` que no atrapa). El nombre accesible del disparador apunta **a dos ids** —el del label y el del propio botón— porque `aria-labelledby` pisa el contenido: con uno solo, el valor elegido no se anuncia nunca.
- **`Common/Skeleton` va `aria-hidden`**, así que **quien lo use tiene que anunciar la carga con un `role="status"` en el contenedor**. Un spinner trae el suyo incluido; cambiarlo por cajas sin eso deja la pantalla muda. Y sus medidas tienen que salir de los mismos tokens que el componente que reemplaza: un esqueleto con medidas inventadas causa el layout shift que viene a evitar (ver `LeaderboardTableSkeleton`, que reusa `TABLE_COLUMNS` y el mismo `TableHeader`).
- **`Common/ErrorMessage` es el aviso de error con reintentar.** Un error no es un estado vacío: no usar `EmptyState` para eso. `onRetry` es opcional y sin él no se dibuja el botón.
- **Un `alt` con el nombre de algo que ya está escrito visible al lado se anuncia dos veces**: en ese caso va `alt=""`. La app tiene los dos casos y están comentados donde aparecen (`MatchSelector` los tiene juntos: en `renderOption` el nombre está al lado, en `renderButton` el único texto es "vs").
- **Cuidado con `outline: none`.** El `button:focus-visible` global de `index.css` cubre a los `<button>` por especificidad, pero los inputs solo tienen `input:focus { border-color: var(--color-primary) }`, que no hace nada si el borde ya es de ese color. Fue el caso de `ScoreInput`. Un anillo con `box-shadow` por fuera del borde no depende del color que tenga el borde.
- Las pantallas de escritura (`PredictionForm`, `MatchManager`, `WorldCupPredictions`) son `<form onSubmit>` con `preventDefault`, así que se guardan con Enter. **`Common/Button` tiene `type="button"` por defecto** justamente para que un botón adentro de un form no lo envíe sin querer: el que envía lo declara.

## Puntos a tener en cuenta

- **Ya no hay god components.** La fase 6 los partió: `RoundManager/index.tsx` pasó de ~1.270 líneas a **165** y `MatchPrediction/index.tsx` a **218**. Sacando `types/database.ts` (generado, 1.631) los archivos más grandes son `AdminWorldCupBonus` (365), `Common/SelectDropdown` (361), `config/tournaments.config.ts` (355) y `MatchManager/MatchResult` (343) — ninguno es un god component, y de los cuatro el único con lógica densa es `MatchResult`. El conteo de líneas dejó de ser un buen proxy: `SelectDropdown` creció en la fase 8 y fue para mejor (teclado completo y el porqué escrito al lado).
- `MatchManager/MatchResult` reimplementa inline la regla del clasificado por penales que `MatchPrediction/qualifier.ts` ya tiene con tests. **No son idénticas**: el formulario muestra el selector solo si el marcador es empate, el panel de admin lo muestra siempre en un playoff y lo deshabilita cuando hay ganador. Unificarlas cambia la UI del admin y toca la escritura que dispara el scoring, así que es una decisión de producto.
- `useAllPredictions` **no devuelve `error`**, así que "Ver pronósticos" no tiene estado de error que mostrar. Es el único hook de datos así.
- Los paneles de finanzas y pagos (`AdminFinance/`, `AdminPayments/` y sus hooks) se **borraron**: estaban terminados pero no cableados a ninguna vista. Están en el historial de git si algún día se retoma la feature; antes hay que arreglar el esquema, porque `round_finances` y `round_payments` no tienen `tournament_id`.
- `no-console` es warning; el código existente usa `// eslint-disable-next-line no-console` para los `console.error` de catch.
- Quedan dos números de fecha hardcodeados: `WORLD_CUP_STANDALONE_ROUNDS = {4, 5}` en `utils/leaderboardRounds.ts` (solo para el Mundial) y el fallback `[17, 18, 19, 20]` de la rama de playoffs de `useLeaderboard.jsx`, que corre únicamente cuando no hay torneo — o sea nunca desde la UI, que siempre tiene uno activo.
