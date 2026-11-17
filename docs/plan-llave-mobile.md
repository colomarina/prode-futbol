# Llave en el celular: tarjetas horizontales y cuadro completo — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** En el celular, las tabs de la llave muestran tarjetas horizontales (local | marcador o "vs" |
visitante), y un botón alterna entre esa vista y el cuadro completo con scroll horizontal.

**Architecture:**
- `BracketMatchCard` gana una prop `layout` (`'stacked'` por defecto, `'versus'` para el celular). Reusa
  la lógica de estados, ganador, penales y pronóstico, y cambia solo la disposición.
- `PlayoffBracket` guarda un estado `view` (`'rounds' | 'bracket'`). Las tabs se renderizan solo en
  `'rounds'`, y el CSS muestra el cuadro de escritorio en el celular cuando `data-view="bracket"`.

**Tech Stack:** React 19 + TypeScript, CSS modules con tokens `--color-*` / `--space-*`, Vitest + Testing
Library.

**Spec:** `docs/diseno-llave-mobile.md`

## Global Constraints

- El escritorio (`min-width: 1024px`) se ve igual que antes: sin botón y con el cuadro de siempre.
- No cambian `utils/bracket.ts` ni `hooks/usePlayoffs.ts`.
- La elección del modo no se persiste: cada montaje arranca en `'rounds'`.
- Copy exacto del botón: `Ver cuadro completo` (en vista por ronda) y `Ver por ronda` (en vista cuadro).
- Sin comentarios nuevos en el código (regla del equipo, aplicada en el PR #13).
- Solo colores por custom properties `--color-*`; un literal sin token va como custom property con nombre.
- Comandos con `npx -y pnpm@10 ...`; tests con `--maxWorkers=2` si la máquina está cargada.

## Review Focus

- **Nombres largos en la tarjeta horizontal** ("Gimnasia y Esgrima La Plata", "Vélez Sarsfield o
  Belgrano") a 360px de ancho: tienen que cortar a dos líneas o con "…" sin empujar el marcador ni
  desbordar la tarjeta. Se verifica en el navegador (Task 2, step 6).
- **Cuadro completo en el celular:** el scroll horizontal queda dentro del recuadro y la página no
  scrollea de costado (`document.documentElement.scrollWidth <= innerWidth`). Task 2, step 6.
- **Pasar a escritorio (o rotar) con `view = 'bracket'`:** desde 1024px, el botón se oculta y el
  cuadro se ve normal. Lo cubre el CSS; se verifica en el navegador (Task 2, step 6).
- **Empate sin clasificado cargado y partido terminado sin marcador:** en `versus` no se muestra
  "Clasificó por penales". Test en Task 1.
- **Tercer puesto en la tab Final:** también va con `layout="versus"`. Test en Task 2.

---

### Task 1: Variante `versus` de `BracketMatchCard`

**Files:**
- Modify: `src/components/Playoffs/BracketMatchCard/index.tsx`
- Modify: `src/components/Playoffs/BracketMatchCard/BracketMatchCard.module.css`
- Test: `src/components/Playoffs/BracketMatchCard/BracketMatchCard.test.jsx`

**Interfaces:**
- Produces: `BracketMatchCard` con la prop `layout?: 'stacked' | 'versus'` (por defecto `'stacked'`).
  El `<article>` lleva `data-layout={layout}`.

- [ ] **Step 1: Escribir los tests que fallan**, en un `describe('BracketMatchCard en versus', ...)`.
  Usan los helpers `match()` y `prediction()` del archivo.
  - `'muestra el marcador entre los dos equipos al terminar'`: con `is_finished: true`, 2-1,
    `state: 'finished'` y `winnerTeamId: 'river'`, el contenedor con `data-testid="versus-center"`
    tiene el texto `2 - 1`. `River Plate` y `Lanús` están en el documento y el `article` tiene
    `data-layout="versus"`.
  - `'muestra vs si el partido no terminó'`: con `state: 'scheduled'`, `versus-center` dice `vs` y se
    ve el horario (`formatMatchTime`).
  - `'marca al ganador con texto'`: con un partido terminado, `clasificado` está una sola vez, en el
    bloque del ganador (`closest('[data-result="winner"]')` contiene `River Plate`).
  - `'en un cruce sin cargar muestra de dónde sale cada lado'`: con `match: null`,
    `sources: [{teams:[river, lanus]}, {teams:[]}]`, se ve `River Plate o Lanús` y `A confirmar`.
  - `'no habla de penales sin marcador ni con empate sin clasificado'`: dos renders, uno terminado sin
    marcador y otro 1-1 sin `qualifier_team_id`. En ninguno aparece `Clasificó por penales`.
  - `'muestra el pronóstico igual que la tarjeta apilada'`: con `prediction()` y un partido terminado,
    se ve `Tu pronóstico: 2-1` y `+3 pts`.

- [ ] **Step 2: Correr los tests y ver que fallen**

Run: `npx -y pnpm@10 exec vitest run src/components/Playoffs/BracketMatchCard`
Expected: FAIL. No existe `data-layout` ni `versus-center`.

- [ ] **Step 3: Implementar la variante**
  - `layout === 'versus'` renderiza:
    - arriba, `<Footer>` (el estado);
    - al medio, un bloque `.versus` en grid `1fr auto 1fr`: dos `VersusTeam` (escudo arriba y nombre
      abajo; `data-result`; `srOnly` "clasificado") y, entre ellos, el `<span data-testid="versus-center">`
      con `${home} - ${away}` si terminó o `vs` si no;
    - después, "Clasificó por penales" si corresponde, y abajo `PredictionLine`.
  - El placeholder en `versus` usa el mismo grid, con `SourceSide` (escudos en `.logos` y nombres
    unidos con ` o `, o `A confirmar`) y `vs` al centro.
  - `stacked` queda idéntico.
  - CSS:
    - `.versus` en grid con `align-items: center` y `gap: var(--space-sm)`;
    - el nombre en `.versusName`, centrado, con dos líneas máximo (`-webkit-line-clamp: 2`) y
      `overflow-wrap: anywhere`;
    - el escudo en versus con `--versus-logo-size: 32px`;
    - el marcador con `font-size: var(--font-size-xl)`, `font-weight: 800` y `tabular-nums`;
    - el loser con `opacity` igual que en `stacked`.

- [ ] **Step 4: Correr los tests y ver que pasen**

Run: `npx -y pnpm@10 exec vitest run src/components/Playoffs/BracketMatchCard`
Expected: PASS, incluidos los tests viejos de `stacked`.

- [ ] **Step 5: Commit**

```bash
git add src/components/Playoffs/BracketMatchCard
git commit -m "feat: la tarjeta de cruce tiene una variante horizontal"
```

### Task 2: Vista por ronda con tarjetas horizontales y botón de cuadro completo

**Files:**
- Modify: `src/components/Playoffs/PlayoffBracket/index.tsx`
- Modify: `src/components/Playoffs/PlayoffBracket/PlayoffBracket.module.css`
- Test: `src/components/Playoffs/PlayoffBracket/PlayoffBracket.test.jsx`

**Interfaces:**
- Consumes: `BracketMatchCard` con `layout="versus"` (Task 1).
- Produces: un div raíz con `data-view={'rounds' | 'bracket'}` y `className={styles.root}`.

- [ ] **Step 1: Escribir los tests que fallan**, en un `describe('PlayoffBracket en el celular', ...)`.
  - `'arranca por ronda con tarjetas horizontales'`: con `octavos()`, el `tabpanel` existe y todos sus
    `article` tienen `data-layout="versus"`. Hay un botón con el nombre `Ver cuadro completo`.
  - `'el botón alterna entre el cuadro completo y la vista por ronda'`:
    - clic en `Ver cuadro completo`: ya no hay `tablist`, el raíz tiene `data-view="bracket"` y el botón
      se llama `Ver por ronda`;
    - clic de nuevo: vuelve el `tablist` y `data-view="rounds"`.
  - `'el tercer puesto de la tab Final también va horizontal'`: con el fixture del test existente del
    tercer puesto, todos los `article` del `tabpanel` tienen `data-layout="versus"`.
  - `'el cuadro de escritorio mantiene las tarjetas apiladas'`: los `article` dentro del
    `[data-connected]` tienen `data-layout="stacked"`.

- [ ] **Step 2: Correr los tests y ver que fallen**

Run: `npx -y pnpm@10 exec vitest run src/components/Playoffs/PlayoffBracket`
Expected: FAIL. No existe el botón ni `data-layout="versus"` en el panel.

- [ ] **Step 3: Implementar**
  - `const [view, setView] = useState<'rounds' | 'bracket'>('rounds')`.
  - Raíz: `<div className={styles.root} data-view={view}>`.
  - Arriba de todo va un `<div className={styles.viewToggle}>` con el `Button` de `Common`
    (`variant="outline"`, `size="sm"`). El texto es `Ver cuadro completo` o `Ver por ronda`, y el botón
    alterna `view`.
  - El bloque `.mobile` (tabs + panel) se renderiza solo con `view === 'rounds'`.
  - `renderCard` recibe el layout: `'versus'` en el panel y en el tercer puesto del panel; `'stacked'`
    en el cuadro.
  - El `thirdPlaceBlock` pasa a ser una función `renderThirdPlace(layout)`.
  - CSS:
    - `.viewToggle { display: flex; justify-content: center; margin-bottom: var(--space-sm) }`, y desde
      1024px `display: none`;
    - `.root[data-view='bracket'] .desktop { display: block }` en el celular;
    - `.board` mantiene `overflow-x: auto`;
    - la raíz con `min-width: 0` para que el scroll quede dentro del recuadro.

- [ ] **Step 4: Correr los tests y ver que pasen**

Run: `npx -y pnpm@10 exec vitest run src/components/Playoffs`
Expected: PASS, todo `Playoffs/`, incluidos los tests viejos.

- [ ] **Step 5: Commit**

```bash
git add src/components/Playoffs/PlayoffBracket
git commit -m "feat: en el celular la llave va por ronda con tarjetas horizontales o como cuadro completo"
```

- [ ] **Step 6: Verificar en el navegador** (playwright-cli, sesión `-s=prode`, torneo sandbox y
  `pnpm dev` corriendo).
  - **390×844:**
    - las tarjetas son horizontales;
    - un nombre largo no desborda;
    - el botón muestra el cuadro con scroll interno y
      `document.documentElement.scrollWidth <= window.innerWidth`.
  - **360px:** el mismo chequeo de desborde.
  - **1280px:** sin botón; el cuadro se ve igual que antes, con o sin `view = 'bracket'` previo.
  - **Modo oscuro:** también OK.
  - Expected: todo lo anterior se cumple. Guardar las capturas en el scratchpad.

### Task 3: Cierre

**Files:**
- Modify: `CLAUDE.md` (el bullet de `match_number` en playoffs; agregar que en el celular la llave va por
  ronda con `layout="versus"` y el botón de cuadro completo).

- [ ] **Step 1:** Actualizar `CLAUDE.md` con una línea.
- [ ] **Step 2:** Con el OK del usuario, correr la suite completa, `typecheck`, `lint`, `format:check` y
  `build`. Expected: todo verde.
- [ ] **Step 3:** Commit `docs: la llave en el celular`, que incluye `docs/diseno-llave-mobile.md` y este
  plan.
