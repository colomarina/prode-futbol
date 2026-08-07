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

**Testing**: Vitest + Testing Library + jsdom. Config en `vitest.config.js`, setup en `src/test/setup.js` (importa `jest-dom` y hace `cleanup()` después de cada test). Los tests van al lado del archivo que prueban (`matchTiming.js` → `matchTiming.test.js`). Cobertura actual: `utils/matchTiming.js`, `constants/hiddenPlayers.js` y `Common/ErrorBoundary`.

CI en `.github/workflows/ci.yml`: corre `lint`, `format:check`, `test` y `build` en cada push a `main` y en cada PR.

Prettier corre **como regla de ESLint** (`prettier/prettier: error`), así que `pnpm lint` falla por problemas de formato. Config: sin punto y coma, comillas simples, `printWidth: 100`, `arrowParens: avoid`.

`.gitignore` ignora `*.config.js` en la raíz, con excepciones explícitas para `src/config/*.config.js`, `eslint.config.js`, `vite.config.js` y `vitest.config.js`. **Un `*.config.js` nuevo en la raíz no se agrega solo: hay que sumarle su propia excepción.**

## Variables de entorno

En `.env` (no versionado), prefijo `VITE_`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY` — ojo: **no** es `VITE_SUPABASE_ANON_KEY`
- `VITE_ALLOW_UPCOMING_TOURNAMENTS_FOR_ADMINS` — si es `'true'`, los admins también pueden entrar a torneos con status `upcoming`

`.env.example` tiene la lista completa con comentarios.

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

**Modo consulta**: `TournamentContext` expone `isReadOnly` (`activeTournament.status !== 'active'`). Es la única definición de "torneo cerrado a escrituras" y la consumen `PredictionForm`, `MatchPrediction`, `WorldCupPredictions`, `Sidebar` (oculta administración), `NavHeader` (badge 🏁) y `Navigation` (entra por la tabla de posiciones en vez del formulario). Cualquier escritura nueva tiene que respetarlo — el gating por status no vive en ningún otro lado. Son guards de UI; qué hace RLS con esas escrituras no está verificado.

### Multi-torneo: el eje central del código

`TournamentContext` guarda el torneo activo, lo persiste en `localStorage` (`active_tournament_slug`) y aplica su tema. **Casi todo hook de datos recibe `activeTournament?.id` y filtra por `tournament_id`.** Al agregar features nuevas, seguir ese patrón o los datos se mezclan entre torneos.

Existen dos ejes de variación por torneo:

- **Tema visual**: `src/config/tournaments.config.js` mapea `slug` → paletas CSS (light/dark) que se inyectan como custom properties en `document.documentElement` y setean `data-tournament`. Las claves deben coincidir con `tournament.slug` en Supabase. Un slug nuevo en la DB sin entrada acá se renderiza con la paleta base de `src/index.css`.
- **Reglas de negocio**: chequeos ad-hoc de slug, sobre todo `slug === 'mundial-2026'` (secciones mundialistas en `Navigation`, colores de grupo en `utils/groupBadgeStyles.js`, criterios de desempate en `InfoPage/info.config.jsx`).

`ThemeContext` (dark/light) y el tema del torneo están acoplados: al togglear el tema se re-aplica `applyTournamentTheme` leyendo el slug desde localStorage.

### Navegación (sin router)

No hay react-router. `src/components/Navigation/index.jsx` es el shell y hace:

- Navegación global vía menú hamburguesa → `Sidebar/menu.config.jsx` (`MENU_ITEMS`, con `viewType`: `tournament`, `info`, `stats`, `profile`, `admin`).
- Sub-navegación por vista vía `pages-with-sections.config.jsx` (`PAGES_WITH_SECTIONS`), que se renderiza en `NavTabs`. El estado `activeSections` es un objeto `{ viewType: sectionId }`.
- Todas las vistas de contenido son `React.lazy` + `Suspense`, envueltas en un `ErrorBoundary` con `key` por vista+sección: `Suspense` cubre la carga pero **no** los errores, así que sin el boundary un chunk que falla (deploy nuevo con la pestaña vieja abierta) dejaba la pantalla en blanco. `Common/ErrorBoundary` distingue ese caso y ofrece recargar.
- Solo maneja dos paths reales (`/` y `/profile`) con `history.pushState` + listener de `popstate`.

`tabs.config.jsx` (`ALL_TABS`) quedó vacío a propósito tras la migración al menú hamburguesa. Para agregar una pantalla: entrada en `MENU_ITEMS` (si es de nivel superior) o en las `*_SECTIONS` correspondientes, más el `case` en el `renderContent()` de `Navigation`.

### Capa de datos

`src/lib/supabase.jsx` exporta un único cliente. Toda la lógica de datos vive en `src/hooks/use*.jsx`; los componentes no llaman a Supabase salvo `MatchManager` y `RoundManager`.

Tablas/vistas: `tournaments`, `rounds`, `matches`, `teams`, `predictions`, `profiles`, `round_scores`, `general_leaderboard` (vista), `world_cup_*` (`teams`, `predictions`, `bonus_config`, `bonus_scores`, `official_results`).

RPCs: `get_personal_stats`, `get_tournament_leaderboard_with_bonus`, `get_round_predictions_summary[_by_tournament]`, `get_round_payments_status[_by_tournament]`, `register_payment[_by_tournament]`, `remove_round_allocation[_by_tournament]`, `upsert_round_finance[_by_tournament]`, `get_all_round_financial_summaries`, `upsert_world_cup_prediction`, `admin_set_world_cup_lock`, `admin_lock_world_cup_predictions`, `recalculate_world_cup_bonus`.

**Patrón de fallback legacy**: varios hooks (`useRoundPayments`, `useRoundFinance`, `useLeaderboard`, `RoundManager`) intentan primero la variante `*_by_tournament` y, si falla, caen a la RPC/consulta pre-multi-torneo. Es intencional (soporta bases sin las funciones nuevas). Al agregar RPCs con scope de torneo, mantener el patrón o eliminarlo deliberadamente en todos los lugares a la vez.

El scoring **no se calcula en el cliente**: los puntos llegan de `round_scores` / RPCs (triggers o funciones en Supabase). No hay migraciones ni SQL en este repo, pero sí un snapshot del esquema en `docs/supabase-schema.md` (tablas, CHECK constraints y qué valores acepta cada campo de estado). No incluye RLS ni triggers.

### Reglas de dominio en el cliente

- `src/utils/matchTiming.js` — fuente única de verdad de tiempos: `PREDICTION_CUTOFF_MINUTES = 10` (cierre de pronósticos), `RESULT_LOAD_DELAY_HOURS = 2` (cuándo el admin puede cargar el resultado), y `getNextActiveRoundNumber()`, que deriva la fecha activa desde los `match_date` (no desde `round.status`). Usar `canPredictMatch()` antes de habilitar cualquier input de pronóstico.
- `src/constants/hiddenPlayers.js` — `filterHiddenPlayers()` oculta jugadores por coincidencia de nombre normalizado. Se aplica en leaderboard, pagos y stats; si agregás una vista con listas de usuarios, aplicalo también.
- `src/constants/predictions.js` duplica `PREDICTION_CUTOFF_MINUTES`; preferir el de `utils/matchTiming.js`.
- `src/constants/worldCupBonus.js` — preguntas bonus del Mundial con sus puntos (`WORLD_CUP_BONUS_MAX_POINTS = 50`) y el mapa slug → código de país para las banderas de flagcdn.
- Sistema de puntos y desempates (texto que ve el usuario): `src/components/InfoPage/info.config.jsx`. El README describe un esquema de puntos viejo (5/3/1) que ya no aplica.

### Estilos

Tres mecanismos conviven: `*.module.css` por componente (lo preferido en código nuevo), estilos inline en JSX (muy común en los componentes viejos y grandes) y bloques `<style>` embebidos (`Navigation` inyecta sus media queries así). Siempre usar las custom properties `--color-*` en vez de hex literales, para que los temas por torneo funcionen. Mobile-first.

## Puntos a tener en cuenta

- `src/components/Navigation/indexs.old.jsx` es código muerto de la navegación anterior.
- `AdminFinance/` y `AdminPayments/` (con sus hooks `useRoundFinance` / `useRoundPayments`) están completos pero **no están cableados a ninguna vista** — no aparecen en `ADMIN_SECTIONS` ni en `renderContent()`.
- `RoundManager/index.jsx` (1273 líneas) y `PredictionForm/MatchPrediction/index.jsx` (719) concentran la mayor complejidad.
- `no-console` es warning; el código existente usa `// eslint-disable-next-line no-console` para los `console.error` de catch.
- Hay números de fecha hardcodeados (p. ej. `STANDALONE_TABLE_ROUNDS = [4, 5]` y el fallback de playoffs `[17, 18, 19, 20]` en `useLeaderboard.jsx`).
