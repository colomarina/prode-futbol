# Selector de clasificado lado a lado y dos ajustes de la llave: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:**
- En "Mis pronósticos", el selector de quién clasifica por penales pasa a ser dos botones lado a lado
  (opción A), y un nombre largo no estira la tarjeta.
- En la tarjeta horizontal de la llave, un cruce sin cargar muestra entero "A o B".
- El lector de pantalla lee el marcador como "2 a 1".

**Architecture:** Cambios de presentación en `QualifierPicker` y `BracketMatchCard`. No cambian las
reglas de `qualifier.ts` (cuándo aparece, cuándo se bloquea) ni la escritura del pronóstico.

**Tech Stack:** React 19 + TypeScript, CSS modules, Vitest + Testing Library.

**Spec:** opción A aprobada por el usuario el 2026-11-17, sobre la maqueta en la app real
(`opcion-A.png`). Los dos ajustes son los hallazgos menores 1 y 2 del review de `feat/llave-mobile`.
Va en la misma rama y en el mismo PR.

## Global Constraints

- **Diseño de la opción A:**
  - grid de 2 columnas `minmax(0, 1fr)`: local a la izquierda y visitante a la derecha, en el orden
    de `teams`;
  - cada botón lleva el escudo (32px) arriba y el nombre centrado abajo, que puede bajar de línea;
  - el elegido lleva borde de 2px `--color-primary`, el fondo resaltado de hoy y un ✓ en la esquina
    superior derecha.
- Se elimina la etiqueta `SELECCIONADO`. El estado sigue en `aria-checked` y el ✓ va `aria-hidden`.
- Accesibilidad sin cambios: `role="radiogroup"` con el mismo `aria-label`, botones `role="radio"`,
  deshabilitados cuando `!canPredict || isLocked`, con el no elegido atenuado.
- Mismos textos de pregunta y de ayuda.
- Sin comentarios nuevos en el código. Solo `--color-*` / tokens; un literal sin token va como custom
  property con nombre.
- Comandos: `npx -y pnpm@10 exec vitest run --maxWorkers=2 <ruta>`.

## Review Focus

- **Nombre largo** ("Gimnasia y Esgrima La Plata") a 360px: el panel no se sale de la tarjeta y la
  página no scrollea de costado. Se verifica en el navegador (Task 1, step 6).
- **Equipo sin escudo** (`logo_url` null): muestra ⚽ del mismo tamaño y no se desalinea. Test en
  Task 1.
- **Bloqueado con marcador no empatado:** el ganador queda elegido y legible, y el otro atenuado. Lo
  cubre el test existente `'bloqueado explica…'`, más una verificación visual.
- **Cruce sin cargar con los dos nombres largos:** se lee entero. Test en Task 2.
- **Marcador terminado sin goles cargados:** el centro sigue diciendo "vs" y no lleva `aria-label`
  de marcador. Test en Task 2.

---

### Task 1: `QualifierPicker` con botones lado a lado

**Files:**
- Modify: `src/components/PredictionForm/MatchPrediction/QualifierPicker/index.tsx`
- Modify: `src/components/PredictionForm/MatchPrediction/QualifierPicker/QualifierPicker.module.css`
- Test: `src/components/PredictionForm/MatchPrediction/QualifierPicker/QualifierPicker.test.jsx`

**Interfaces:** sin cambios. Las mismas props (`teams`, `selectedTeamId`, `isLocked`, `canPredict`,
`onSelect`).

- [ ] **Step 1: Escribir los tests que fallan y actualizar los que asumían `SELECCIONADO`**
  - `'marca el equipo elegido y solo ese'`: en lugar de `getAllByText('SELECCIONADO')`, verifica que
    `getAllByTestId('qualifier-check')` tenga largo 1 y esté dentro del radio del visitante.
  - `'sin nada elegido no marca ninguna opción'`: `queryByTestId('qualifier-check')` es `null`.
  - Nuevo: `'muestra el escudo de cada equipo'`: con `logo_url` en los fixtures, cada radio contiene
    un `img` con ese `src` y `alt=""`.
  - Nuevo: `'sin escudo muestra la pelota'`: con `logo_url: null`, el radio contiene `⚽` con
    `aria-hidden`.
  - Nuevo: `'ya no dice SELECCIONADO'`: `queryByText('SELECCIONADO')` es `null`, con un equipo
    elegido.
- [ ] **Step 2: Correr y ver que fallen**

  Run: `npx -y pnpm@10 exec vitest run --maxWorkers=2 src/components/PredictionForm/MatchPrediction/QualifierPicker`

  Expected: FAIL. No hay `qualifier-check`, ni escudos, y sigue apareciendo `SELECCIONADO`.
- [ ] **Step 3: Implementar.**
  - Cada `button role="radio"` lleva el escudo, el nombre y, si está elegido,
    `<span data-testid="qualifier-check" aria-hidden="true">✓</span>`.
  - CSS:
    - `.options` en grid de dos columnas `minmax(0, 1fr)`;
    - `.option` en columna, centrada, con `position: relative` y `min-width: 0`;
    - `--qualifier-logo-size: 32px`;
    - el nombre con `overflow-wrap: anywhere`, sin `nowrap`;
    - el check en posición absoluta arriba a la derecha.
  - Se borran `.radio`, `.selectedTag` y la `ellipsis` de `.teamName`. Se mantienen las reglas
    `:disabled` y `[aria-checked='true']`.
- [ ] **Step 4: Correr y ver que pasen**, también `MatchPrediction`.

  Run: `npx -y pnpm@10 exec vitest run --maxWorkers=2 src/components/PredictionForm`

  Expected: PASS.
- [ ] **Step 5: Commit** `feat: el clasificado por penales se elige con dos botones lado a lado`.
- [ ] **Step 6: Verificar en el navegador**, en `/pronosticos` del sandbox, con un nombre largo
  inyectado como en la maqueta.
  - **390 y 360px:** sin desborde (`scrollWidth <= innerWidth`) y el panel dentro de la tarjeta.
  - **Bloqueado** (marcador 2-1): el ganador queda elegido y el otro atenuado.
  - **1280px y modo claro:** se ve bien.

### Task 2: Dos ajustes de la tarjeta horizontal de la llave

**Files:**
- Modify: `src/components/Playoffs/BracketMatchCard/index.tsx`
- Modify: `src/components/Playoffs/BracketMatchCard/BracketMatchCard.module.css`
- Test: `src/components/Playoffs/BracketMatchCard/BracketMatchCard.test.jsx`

- [ ] **Step 1: Escribir los tests que fallan**, en `describe('BracketMatchCard en versus')`.
  - `'el marcador se anuncia como 2 a 1'`: con un partido terminado 2-1, `versus-center` tiene
    `aria-label="2 a 1"`.
  - `'vs no lleva etiqueta de marcador'`: con un partido programado, `versus-center` no tiene
    `aria-label`.
  - `'un cruce sin cargar con nombres largos se puede leer entero'`: con
    `sources[0].teams = [Gimnasia y Esgrima La Plata, Vélez Sarsfield]`, el nombre tiene
    `title="Gimnasia y Esgrima La Plata o Vélez Sarsfield"` y `data-lines="3"`.
- [ ] **Step 2: Correr y ver que fallen.**

  Run: `npx -y pnpm@10 exec vitest run --maxWorkers=2 src/components/Playoffs/BracketMatchCard`

  Expected: FAIL.
- [ ] **Step 3: Implementar.**
  - `VersusCenter` recibe un `label?: string`. Con marcador, `label = \`${home} a ${away}\``, y si
    hay label se le pone `aria-label`.
  - `SourceSide` pone `title` con el texto completo y `data-lines="3"`; el CSS
    `.versusName[data-lines='3']` sube `-webkit-line-clamp` a 3.
- [ ] **Step 4: Correr y ver que pasen.**

  Run: `npx -y pnpm@10 exec vitest run --maxWorkers=2 src/components/Playoffs`

  Expected: PASS.
- [ ] **Step 5: Commit** `fix: la tarjeta horizontal anuncia el marcador y no corta los cruces sin cargar`.

### Task 3: Cierre

- [ ] Typecheck, lint y Prettier sobre lo tocado.
- [ ] Con el OK del usuario: la suite completa y `build`.
- [ ] Commit `docs: plan del selector de clasificado`, con este archivo.
