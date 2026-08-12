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
pnpm format         # prettier --write sobre src/
pnpm format:check
```

**Testing**: Vitest + Testing Library + jsdom. Config en `vitest.config.js`, setup en `src/test/setup.js` (importa `jest-dom` y hace `cleanup()` después de cada test). Los tests van al lado del archivo que prueban (`matchTiming.js` → `matchTiming.test.js`).

Para testear un hook de datos: `src/test/supabaseMock.js` arma un mock del query builder encadenable de Supabase y cuenta consultas por tabla (útil para verificar que el cache deduplica). Ver `useRounds.test.jsx` como referencia — hay que mockear `../lib/supabase` con un getter y envolver el `renderHook` en un `QueryClientProvider` con `retry: false`.

CI en `.github/workflows/ci.yml`: corre `lint`, `format:check`, `test` y `build` en cada push a `main` y en cada PR.

Prettier corre **como regla de ESLint** (`prettier/prettier: error`), así que `pnpm lint` falla por problemas de formato. Config: sin punto y coma, comillas simples, `printWidth: 100`, `arrowParens: avoid`.

`.gitignore` ignora `*.config.js` en la raíz, con excepciones explícitas para `src/config/*.config.js`, `eslint.config.js`, `vite.config.js` y `vitest.config.js`. **Un `*.config.js` nuevo en la raíz no se agrega solo: hay que sumarle su propia excepción.**

## Variables de entorno

En `.env` (no versionado), prefijo `VITE_`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY` — ojo: **no** es `VITE_SUPABASE_ANON_KEY`
- `VITE_ALLOW_UPCOMING_TOURNAMENTS_FOR_ADMINS` — si es `'true'`, los admins también pueden entrar a torneos con status `upcoming`

`.env.example` tiene la lista completa con comentarios.

`src/lib/supabase.jsx` **no** debe tirar si faltan las variables: `createClient` se ejecuta al evaluar el módulo, o sea antes de que React monte, así que un throw ahí deja la pantalla en blanco sin mensaje (ni el `ErrorBoundary` llega a existir). En su lugar construye el cliente con placeholders y exporta `missingSupabaseEnvVars`; `App.jsx` lo chequea antes de los providers y renderiza `Common/ConfigError`. En Vercel las variables se configuran por entorno: Production, Preview y Development son listas separadas.

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

**Torneos de prueba** (`src/utils/tournamentAccess.js`): los que tienen slug con prefijo `test-` solo son accesibles y visibles para admins. Se distinguen por slug y no por `status` a propósito — quedan en `active`, o sea escribibles, porque cualquier otro status los volvería `isReadOnly` e inservibles para probar. El filtro se aplica en `App.jsx` (acceso + lista del selector) y en `Sidebar` (contador de "Cambiar torneo"). No hay entorno de desarrollo separado: es el mecanismo para probar contra la base real sin tocar un torneo en curso.

**Modo consulta**: `TournamentContext` expone `isReadOnly` (`activeTournament.status !== 'active'`). Es la única definición de "torneo cerrado a escrituras" y la consumen `PredictionForm`, `MatchPrediction`, `WorldCupPredictions`, `Sidebar` (oculta administración), `NavHeader` (badge 🏁) y `Navigation` (entra por la tabla de posiciones en vez del formulario). Cualquier escritura nueva tiene que respetarlo — el gating por status no vive en ningún otro lado. Son guards de UI; qué hace RLS con esas escrituras no está verificado.

### Multi-torneo: el eje central del código

`TournamentContext` guarda el torneo activo, lo persiste en `localStorage` (`active_tournament_slug`) y aplica su tema. **Casi todo hook de datos recibe `activeTournament?.id` y filtra por `tournament_id`.** Al agregar features nuevas, seguir ese patrón o los datos se mezclan entre torneos.

Existen dos ejes de variación por torneo:

- **Tema visual**: `src/config/tournaments.config.js` mapea `slug` → paletas CSS (light/dark) que se inyectan como custom properties en `document.documentElement` y setean `data-tournament`. Las claves deben coincidir con `tournament.slug` en Supabase. Un slug nuevo en la DB sin entrada acá se renderiza con la paleta base de `src/index.css`.
- **Reglas de negocio**: chequeos ad-hoc de slug, sobre todo `slug === 'mundial-2026'` (secciones mundialistas en `Navigation`, colores de grupo en `utils/groupBadgeStyles.js`, criterios de desempate en `InfoPage/info.config.jsx`).

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

`src/lib/supabase.jsx` exporta un único cliente. Toda la lógica de datos vive en `src/hooks/use*.jsx`. La única lectura que queda fuera de un hook es la RPC de progreso de jugadores en `RoundManager`.

**TanStack Query**: todos los hooks de datos están migrados. Ya no queda ningún `useEffect` de fetching en `src/hooks/`.

- Cliente y defaults en `src/lib/queryClient.js` (`staleTime` 30s, `retry` 1 en lecturas y **0 en mutaciones**, porque reintentar una escritura duplicaría un pronóstico).
- **Las query keys se arman siempre con `src/lib/queryKeys.js` y empiezan por el id del torneo.** Es lo que impide que el cache mezcle torneos, igual que el filtro `tournament_id` en las queries. Nunca escribir un array de key a mano.
- `useMatchesMeta` es la consulta compartida de "todos los partidos del torneo" (`id, round_number, match_date, is_finished, is_playoff`). Su select es un superconjunto a propósito: la usan `useRounds`, `MatchManager`, `RoundManager`, `LeaderBoard` y `Navigation`. Si necesitás otra columna de esa lista, agregala ahí en vez de crear una query nueva. Sin `tournamentId` la query queda deshabilitada (`enabled`), porque traer los partidos de todos los torneos no sirve para nada.
- Las mutaciones invalidan en vez de parchear estado local, y conservan el contrato `{ data, error }` que ya usan los componentes.
- Las devtools están disponibles en `pnpm dev` (botón abajo a la izquierda); son la forma de verificar que no haya queries duplicadas.
- Cuándo pedir datos se expresa con `enabled`, no con un `if` adentro de un efecto. Si `enabled` es `false`, `isPending` queda en `true` para siempre: por eso los hooks devuelven `loading` combinado con la misma condición (ver `useMatches`, `usePredictions`).
- `useLeaderboard` exporta `fetchLeaderboardData` aparte del hook: la lógica de ramas (general / por fecha / playoffs / con bonus) vive en una función suelta para que se pueda testear sin montar React.

Los `value` de `TournamentContext` y `ThemeContext` van con `useMemo` y sus funciones con `useCallback`. `TournamentContext` lo consumen ~15 componentes: un objeto nuevo por render re-renderiza el árbol entero.

Tablas/vistas: `tournaments`, `rounds`, `matches`, `teams`, `predictions`, `profiles`, `round_scores`, `general_leaderboard` (vista), `world_cup_*` (`teams`, `predictions`, `bonus_config`, `bonus_scores`, `official_results`).

RPCs que usa el cliente: `get_personal_stats`, `get_tournament_leaderboard_with_bonus`, `get_round_predictions_summary[_by_tournament][_v2]`, `upsert_world_cup_prediction`, `admin_set_world_cup_lock`, `admin_lock_world_cup_predictions`, `recalculate_world_cup_bonus`.

En Supabase existen además las RPCs de pagos y finanzas (`get_round_payments_status`, `register_payment`, `remove_round_allocation`, `upsert_round_finance`, `get_all_round_financial_summaries`, con sus variantes `_by_tournament`), pero **ya no las llama nadie**: los paneles que las usaban se borraron por no estar cableados.

**Nunca consultar sin scope de torneo.** Los `round_number` se repiten entre torneos, así que una query a `round_scores` (o la RPC `get_round_predictions_summary` legacy) sin `tournament_id` no devuelve un error: devuelve datos de otros torneos mezclados. Existía un patrón de fallback que ante un error en la query scopeada reintentaba sin el filtro — se eliminó, porque degradaba en silencio a datos incorrectos. Si la consulta con scope falla, propagar el error.

`RoundManager` todavía prueba dos RPC con scope en orden (`_by_tournament_v2` y `_by_tournament`) porque no todas las bases tienen la primera; eso es aceptable, las dos filtran por torneo. Lo que no se hace más es caer a la variante sin scope.

**Ordenamiento de tablas**: `src/utils/ranking.js` (`compareByPoints`, `assignPositions`) es la única forma de ordenar un ranking. Lo usan `useLeaderboard` y las dos agregaciones de `usePersonalStats`. Si una pantalla nueva ordena por su cuenta, va a mostrar posiciones distintas ante empates.

El scoring **no se calcula en el cliente**: los puntos llegan de `round_scores` / RPCs (triggers o funciones en Supabase). No hay migraciones ni SQL en este repo, pero sí un snapshot del esquema en `docs/supabase-schema.md` (tablas, CHECK constraints y qué valores acepta cada campo de estado). No incluye RLS ni triggers.

### Reglas de dominio en el cliente

- `src/utils/matchTiming.js` — fuente única de verdad de tiempos: `PREDICTION_CUTOFF_MINUTES = 10` (cierre de pronósticos), `RESULT_LOAD_DELAY_HOURS = 2` (cuándo el admin puede cargar el resultado), y `getNextActiveRoundNumber()`, que deriva la fecha activa desde los `match_date` (no desde `round.status`). Usar `canPredictMatch()` antes de habilitar cualquier input de pronóstico, y `getResultLoadTime()` para mostrar el horario — no recalcular el delay a mano, o el texto termina mintiendo cuando cambia la constante.
- `src/constants/hiddenPlayers.js` — `filterHiddenPlayers()` oculta jugadores por coincidencia de nombre normalizado. Se aplica en `useLeaderboard`, `useAllPredictions`, `RoundManager` y `usePersonalStats` (este último con `isHiddenPlayer` sobre el perfil embebido, y sin filtrar nunca al usuario propio). **Si agregás una vista con listas de usuarios, aplicalo también**: si un consumidor se lo saltea, los totales dejan de coincidir entre pantallas.
- `PREDICTION_CUTOFF_MINUTES` vive solo en `utils/matchTiming.js` (se borró la copia de `constants/predictions.js`). No volver a duplicarla.
- `src/utils/leaderboardRounds.js` — qué fechas tienen tabla propia en la tabla de posiciones y si el torneo tiene playoffs. **El criterio sale de los partidos, no de `rounds.status`**: una fecha aparece cuando tiene al menos un partido `is_finished`, y las de playoff se detectan por `is_playoff` en vez de por un rango fijo. `rounds.status` se actualiza a mano desde el panel de fechas y queda desincronizado (Clausura 2026 tiene la fecha 4 jugada entera y en `open`; en el Mundial las de playoff siguen en `pending`), así que filtrar por status hacía desaparecer fechas ya jugadas. Lo consumen `LeaderBoard` (opciones del selector) y `Navigation` (mostrar u ocultar el tab de la llave). `WORLD_CUP_STANDALONE_ROUNDS = {4, 5}` es la única excepción hardcodeada y **solo aplica al Mundial**: ahí 16avos y octavos tienen tabla propia y el resto se agrega en "Cuartos a Final".
- `src/constants/worldCupBonus.js` — preguntas bonus del Mundial con sus puntos (`WORLD_CUP_BONUS_MAX_POINTS = 50`) y el mapa slug → código de país para las banderas de flagcdn.
- Sistema de puntos y desempates (texto que ve el usuario): `src/components/InfoPage/info.config.jsx`. El README describe un esquema de puntos viejo (5/3/1) que ya no aplica.

### Estilos

Tres mecanismos conviven: `*.module.css` por componente (lo preferido en código nuevo), estilos inline en JSX (muy común en los componentes viejos y grandes) y bloques `<style>` embebidos (`Navigation` inyecta sus media queries así). Siempre usar las custom properties `--color-*` en vez de hex literales, para que los temas por torneo funcionen. Mobile-first.

## Puntos a tener en cuenta

- `PredictionForm/MatchPrediction/index.jsx` (719 líneas) y `RoundManager/index.jsx` (~890) concentran la mayor complejidad.
- Los paneles de finanzas y pagos (`AdminFinance/`, `AdminPayments/` y sus hooks) se **borraron**: estaban terminados pero no cableados a ninguna vista. Están en el historial de git si algún día se retoma la feature; antes hay que arreglar el esquema, porque `round_finances` y `round_payments` no tienen `tournament_id`.
- `no-console` es warning; el código existente usa `// eslint-disable-next-line no-console` para los `console.error` de catch.
- Quedan dos números de fecha hardcodeados: `WORLD_CUP_STANDALONE_ROUNDS = {4, 5}` en `utils/leaderboardRounds.js` (solo para el Mundial) y el fallback `[17, 18, 19, 20]` de la rama de playoffs de `useLeaderboard.jsx`, que corre únicamente cuando no hay torneo — o sea nunca desde la UI, que siempre tiene uno activo.
