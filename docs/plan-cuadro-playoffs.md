# Cuadro de playoffs — plan de implementación

> **Para agentes:** SUB-SKILL REQUERIDA: usar superpowers:subagent-driven-development (recomendado) o
> superpowers:executing-plans para ejecutar este plan tarea por tarea. Los pasos usan checkboxes (`- [ ]`).

**Objetivo:** que `/playoffs` muestre un cuadro real (cruces con conectores, "A confirmar" en las
rondas futuras) con los datos del prode en cada cruce (tu pronóstico, puntos, clasificado), y en el
celular una ronda por vez con tabs.

**Arquitectura:** toda la lógica del cuadro sale de los componentes y va a una función pura,
`buildBracket` (`src/utils/bracket.ts`), testeada sin React. Una sola tarjeta (`BracketMatchCard`)
sirve para escritorio y celular. `PlayoffBracket` decide el layout: cuadro con conectores desde
1024px, tabs por ronda debajo. `PlayoffMatch` se borra.

**Stack:** React 19 + TypeScript, CSS modules, Vitest + Testing Library. Sin dependencias nuevas.

**Spec:** la conversación del 16/11/2026 (no hay documento aparte). Lo acordado:
cuadro como la captura del Clausura (octavos → final, "A confirmar"), más los datos del prode,
una ronda por vez en móvil, y el Apertura sin líneas si sus cruces no cierran.

## Restricciones globales

- `match_number` en un playoff es la **posición en el cuadro**: el partido `i` de una ronda se
  alimenta de los partidos `2i-1` y `2i` de la anterior. `usePlayoffs` ya ordena por
  `round_number, match_number`; no cambiar eso.
- Colores solo con `--color-*`; espaciados, radios y tipografía con los tokens de
  `src/styles/tokens.css`. Literal sin token exacto → se deja con el motivo comentado al lado.
- Estilos en `*.module.css`, no inline (lo preferido para código nuevo, ver CLAUDE.md).
- Escudo con nombre visible al lado → `alt=""`.
- Ganador/eliminado no puede distinguirse **solo** por color: va también un texto
  (visualmente oculto) "clasificado".
- Tests en `.jsx`/`.js` al lado del archivo. Prettier: sin `;`, comillas simples, `printWidth: 100`.
- Español en UI, comentarios y commits. Commits terminan con
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **La suite completa se corre solo cuando Lucas avisa** (la máquina queda con la CPU al
  mango). Entre tanto, correr solo el archivo de test de la tarea.

## Foco de revisión

1. **Cuadro cuyos cruces no cierran** (el Apertura: el ganador del partido 1 jugó contra el del 4):
   se muestra sin conectores, nunca con líneas que mientan. → test en Tarea 2.
2. **Empate en un playoff terminado:** el ganador es `qualifier_team_id`, no "nadie".
   Si no está cargado todavía, no se marca ganador. → test en Tarea 2.
3. **Ronda futura parcialmente cargada** (2 de 4 cuartos): los 2 cargados en su posición y
   "A confirmar" en el resto, sin correr los cargados a los primeros lugares. → test en Tarea 2.
4. **Torneo que arranca en otra ronda** (el Mundial empieza en 16avos): el cuadro arranca en la
   primera ronda con partidos. → test en Tarea 2.
5. **Partido en juego** (empezó y no terminó): dice "En juego", no muestra marcador viejo ni
   puntos. → test en Tarea 3.

---

### Tarea 0: rama y cierre de lo pendiente

Lo de hoy (orden por horario en `useMatches`, números ocultos en playoffs) está sin commitear en
`main`, junto con cambios de Lucas en `docs/` que **no** son de este trabajo.

- [ ] **Paso 1:** `git switch -c feat/cuadro-playoffs`
- [ ] **Paso 2 (cuando Lucas avise):** `pnpm test`. Esperado: todo verde. La corrida anterior dio
  46 archivos y la previa 52: contar los `*.test.*` de `src/` (`find src -name "*.test.*" | wc -l`)
  y confirmar que el número coincide con el que reporta Vitest. Si no coincide, frenar y avisar.
- [ ] **Paso 3:** commitear **solo** estos archivos:

```bash
git add src/hooks/useMatches.ts src/hooks/useMatches.test.jsx src/test/supabaseMock.js
git commit -m "fix: los partidos se listan por horario y no por número"
git add src/utils/matchNumber.ts src/utils/matchNumber.test.js \
  src/components/PredictionForm/MatchPrediction/MatchHeader/index.tsx \
  src/components/MatchManager/MatchResult/index.tsx \
  src/components/AdminMatchSchedule/index.tsx \
  src/components/AllPredictions/MatchCardHeader/index.tsx \
  src/components/AllPredictions/MatchSelector/index.tsx \
  src/components/Playoffs/PlayoffMatch/index.tsx
git commit -m "feat: el número de partido no se muestra en playoffs"
```

`docs/refactor-pendiente.md`, `docs/plan-seguridad.md` y este plan quedan afuera.

---

### Tarea 1: datos de prueba en el sandbox

El Clausura no tiene resultados, así que no hay forma de ver ganadores, penales ni conectores.
El torneo `test-sandbox` (solo admins) tiene la fecha 17 "Cuartos de final" con estado `pending`.

**Archivos:**
- Crear: `docs/sandbox-playoffs.sql`

- [ ] **Paso 1:** escribir el SQL. Una transacción que, sobre `test-sandbox`
  (`1e7140a6-7b29-4cc8-81fd-dcf9c166192e`), borra los partidos de playoff existentes del sandbox
  y carga:
  - fecha 16 "Octavos de Final" (ronda nueva, `status = 'pending'`): 8 partidos
    `playoff_stage = 'octavos'`, numerados por cuadro. 5 terminados (uno 1-1 con
    `qualifier_team_id`, uno 1-1 **sin** `qualifier_team_id`), 1 empezado hace 30 min sin
    terminar, 2 futuros.
  - fecha 17 (ya existe): 2 de los 4 cuartos, en los `match_number` 1 y 3, con los ganadores
    correctos de sus octavos.
  - Equipos: ids reales de `teams` (usar los 16 del Clausura).
  - **No** insertar en `predictions` (es de usuarios reales); los pronósticos se cargan a mano
    desde la UI.
- [ ] **Paso 2:** mostrarle el SQL a Lucas. **No correr sin su OK.**
- [ ] **Paso 3:** correrlo con el MCP de Supabase y verificar con un `select` que hay 8 octavos
  y 2 cuartos en el sandbox.
- [ ] **Paso 4:** commit `chore: datos de playoffs para el torneo sandbox`.

---

### Tarea 2: `buildBracket` — el modelo del cuadro

**Archivos:**
- Crear: `src/utils/bracket.ts`
- Test: `src/utils/bracket.test.js`

**Interfaces:**
- Consume: `MatchesByStage` (`hooks/usePlayoffs`), `getWinnerTeamId` (`utils/score`),
  `hasMatchStarted` (`utils/matchTiming`), `PlayoffStage`, `MatchWithTeams`, `Uuid` (`types/domain`).
- Produce:

```ts
export type SlotState = 'scheduled' | 'live' | 'finished'
export interface BracketSlot {
  match: MatchWithTeams | null   // null = "A confirmar"
  state: SlotState | null        // null si no hay partido
  winnerTeamId: Uuid | null
}
export interface BracketRound { stage: PlayoffStage; label: string; slots: BracketSlot[] }
export interface Bracket { rounds: BracketRound[]; connected: boolean }

export const STAGE_LABELS: Record<PlayoffStage, string>
// '32avos de final' | '16avos de final' | 'Octavos de final' | 'Cuartos de final' | 'Semifinales' | 'Final'
export function getPlayoffWinnerId(match: Pick<Match,
  'is_finished' | 'home_score' | 'away_score' | 'home_team_id' | 'away_team_id' | 'qualifier_team_id'>): Uuid | null
export function buildBracket(matchesByStage: MatchesByStage, now?: Date): Bracket
export function getCurrentStage(bracket: Bracket): PlayoffStage | null
```

Reglas:
- `getPlayoffWinnerId`: `null` si no terminó; si no, `getWinnerTeamId`; si es empate,
  `qualifier_team_id` (o `null` si no está cargado).
- `buildBracket`: las rondas van desde la primera con partidos hasta `final`. Sin partidos →
  `{ rounds: [], connected: false }`. Cantidad de slots: la primera ronda = sus partidos; cada
  siguiente = `max(partidos, ceil(anterior / 2))`. **Cada partido va en el slot
  `match_number - 1`** (no en el primero libre); si `match_number` falta o se pasa de rango, va al
  primer slot libre. `state`: `finished` si `is_finished`, `live` si empezó (`now`), si no
  `scheduled`.
- `connected`: `true` solo si cada ronda tiene exactamente la mitad de slots que la anterior
  **y** cada equipo de cada partido de la ronda `r` (slot `i`) jugó en el slot `2i` o `2i+1` de la
  ronda `r-1`. Un solo equipo que no cumpla → `false`.
- `getCurrentStage`: la primera ronda con un slot vacío o un partido sin terminar; si están todas
  terminadas, la última. `null` sin rondas.

- [ ] **Paso 1: escribir los tests que fallan**

```js
// Helper del test: m(stage, number, home, away, extra) arma un MatchWithTeams mínimo.
it('getPlayoffWinnerId: gana el de más goles')            // 2-1 → home
it('getPlayoffWinnerId: en empate gana el clasificado')   // 1-1 + qualifier 'b' → 'b'
it('getPlayoffWinnerId: empate sin clasificado cargado')  // → null
it('getPlayoffWinnerId: sin terminar no hay ganador')     // is_finished false, 2-0 → null
it('completa las rondas futuras con A confirmar')
  // 8 octavos → rounds.map(r => r.slots.length) toEqual [8, 4, 2, 1]; cuartos todos match null
it('pone cada partido en su posición del cuadro')
  // cuartos cargados con match_number 1 y 3 → slots[0] y slots[2] con partido, [1] y [3] null
it('arranca en la primera ronda con partidos')
  // solo 16avos y octavos → rounds[0].stage === '16avos', último 'final'
it('marca conectado un cuadro que cierra')
  // octavos 1(a-b) 2(c-d), cuartos 1(a-c) → connected true
it('no conecta un cuadro cuyos cruces no cierran')
  // el caso del Apertura: octavos 1(Talleres-Belgrano) 4(IndRiv-Unión), cuartos 1(Belgrano-Unión)
  // → connected false
it('marca en juego un partido empezado y sin terminar')
  // match_date = now - 30min, is_finished false → state 'live'
it('getCurrentStage: la primera ronda incompleta')
  // octavos terminados, cuartos vacíos → 'cuartos'
it('getCurrentStage: todo terminado devuelve la final')
```

- [ ] **Paso 2:** `pnpm vitest run src/utils/bracket.test.js` → FALLA (módulo inexistente).
- [ ] **Paso 3:** implementar `src/utils/bracket.ts` con las firmas de arriba. `now` por
  parámetro (default `new Date()`) para que el test no dependa del reloj.
- [ ] **Paso 4:** `pnpm vitest run src/utils/bracket.test.js` → PASA.
- [ ] **Paso 5:** commit `feat: modelo del cuadro de playoffs`.

---

### Tarea 3: `BracketMatchCard` — la tarjeta del cruce

**Archivos:**
- Crear: `src/components/Playoffs/BracketMatchCard/index.tsx`
- Crear: `src/components/Playoffs/BracketMatchCard/BracketMatchCard.module.css`
- Test: `src/components/Playoffs/BracketMatchCard/BracketMatchCard.test.jsx`

**Interfaces:**
- Consume: `BracketSlot` (Tarea 2), `PlayoffPrediction` (`hooks/usePlayoffs`),
  `resolveTeamName` (`utils/teams`), `formatMatchDateShort`, `formatMatchTime` (`utils/matchDate`).
- Produce: `export default memo(function BracketMatchCard(props: { slot: BracketSlot;
  prediction?: PlayoffPrediction | null }))`.

Contenido:
- Dos filas de equipo: escudo (`alt=""`), nombre, y el marcador a la derecha si terminó.
  El ganador con `data-result="winner"` y un `<span className="sr-only">` "clasificado"
  (verificar si existe la clase utilitaria en `index.css`; si no, agregarla ahí); el otro
  con `data-result="loser"` (atenuado con `opacity`).
- Empate terminado con clasificado: debajo, "Clasificó por penales".
- Pie: `scheduled` → `"{formatMatchDateShort} · {formatMatchTime}"`; `live` → "En juego";
  `finished` → "Final".
- Con `prediction`: "Tu pronóstico: 2-1". Si terminó, además `+N pts`; si fue empate, el
  clasificado elegido con ✅/❌. En `live` no se muestran puntos.
- `slot.match === null`: dos filas "A confirmar" con `data-placeholder` (borde punteado).
- Sin `prediction` y partido no empezado: nada (no "No pronosticaste": el usuario puede estar
  a tiempo).

- [ ] **Paso 1: tests que fallan**

```js
it('muestra A confirmar en un slot vacío')            // getAllByText('A confirmar') length 2
it('marca al ganador con texto, no solo color')       // getByText('clasificado') dentro de la fila del ganador
it('muestra Clasificó por penales en un empate')
it('muestra el horario de un partido programado')     // texto con formatMatchTime del match_date
it('dice En juego y no muestra puntos')               // state 'live', prediction con points 3 → queryByText(/pts/) null
it('muestra el pronóstico y los puntos al terminar') // 'Tu pronóstico: 2-1' y '+3 pts'
```

- [ ] **Paso 2:** correr el test → FALLA.
- [ ] **Paso 3:** implementar.
- [ ] **Paso 4:** correr el test → PASA.
- [ ] **Paso 5:** commit `feat: tarjeta de cruce para el cuadro de playoffs`.

---

### Tarea 4: `PlayoffBracket` — cuadro en escritorio, tabs en el celular

**Archivos:**
- Reescribir: `src/components/Playoffs/PlayoffBracket/index.tsx`
- Reescribir: `src/components/Playoffs/PlayoffBracket/PlayoffBracket.module.css`
- Crear: `src/components/Playoffs/StageTabs/index.tsx` (+ `StageTabs.module.css`)
- Test: `src/components/Playoffs/PlayoffBracket/PlayoffBracket.test.jsx`,
  `src/components/Playoffs/StageTabs/StageTabs.test.jsx`
- Borrar: `src/components/Playoffs/PlayoffMatch/`
- Modificar: `src/utils/teams.ts:5` (el comentario nombra a `PlayoffMatch`)

**Interfaces:**
- Consume: `buildBracket`, `getCurrentStage`, `STAGE_LABELS`, `Bracket` (Tarea 2),
  `BracketMatchCard` (Tarea 3).
- Produce: `PlayoffBracket` con las **mismas props que hoy** (`matchesByStage`,
  `predictionsByMatch`), así `Playoffs/index.tsx` no cambia salvo el texto del encabezado.
  `StageTabs({ rounds: BracketRound[]; selected: PlayoffStage; onSelect: (s: PlayoffStage) => void })`.

Escritorio (≥1024px):
- Una columna por ronda con su título. Cada columna es `flex-direction: column;
  justify-content: space-around` con la misma altura, así los cruces quedan centrados respecto
  de sus dos partidos de origen sin calcular márgenes a mano (reemplaza `getStackStyle` y
  `BRACKET_UNIT`).
- Los partidos se agrupan de a dos en un `.pair`. Conectores con pseudo-elementos, solo si
  `bracket.connected` (atributo `data-connected` en el contenedor): línea horizontal saliendo de
  cada partido, línea vertical en el `.pair` entre los centros de sus dos partidos, y línea
  horizontal entrando a cada partido de la ronda siguiente. Color `var(--color-border)`.
- Scroll horizontal si no entra (como hoy), con la final visible al final.

Celular (<1024px):
- `StageTabs` arriba con las rondas del cuadro; arranca en `getCurrentStage`.
- `role="tablist"` / `role="tab"` / `aria-selected` / `aria-controls`, y el panel con
  `role="tabpanel"`. Flechas izquierda/derecha y `Home`/`End` mueven la selección y el foco
  (mismo patrón que `Navigation/NavTabs`); `tabIndex` 0 solo en el tab elegido.
- Los partidos de la ronda elegida **en orden de horario** (lo que pidió Lucas para el
  formulario), los "A confirmar" al final.

- [ ] **Paso 1: tests que fallan**

```js
// PlayoffBracket
it('dibuja las rondas hasta la final con A confirmar')  // 8 octavos → headings Octavos/Cuartos/Semifinales/Final
it('conecta el cuadro solo si los cruces cierran')     // data-connected 'true' / 'false' con los fixtures de la Tarea 2
it('abre en el celular la ronda en curso')             // octavos terminados → tab 'Cuartos de final' aria-selected true
it('lista la ronda elegida por horario')               // 3 octavos con match_number 1,2,3 y horarios 3º,1º,2º → orden 2,3,1
// StageTabs
it('mueve la selección con las flechas')               // ArrowRight en Octavos → onSelect('cuartos')
it('Home y End van a la primera y la última ronda')
```

- [ ] **Paso 2:** correr los dos tests → FALLAN.
- [ ] **Paso 3:** implementar `StageTabs`, reescribir `PlayoffBracket` y su CSS, borrar
  `PlayoffMatch/`, actualizar el comentario de `utils/teams.ts`. En `Playoffs/index.tsx`,
  cambiar el subtítulo por "Tu pronóstico y tus puntos en cada cruce."
- [ ] **Paso 4:** correr los dos tests → PASAN. `pnpm typecheck` y `pnpm lint` limpios.
- [ ] **Paso 5:** commit `feat: cuadro de playoffs con conectores y tabs por ronda`.

---

### Tarea 5: verificación en la app

- [ ] **Paso 1 (cuando Lucas avise):** `pnpm test`, `pnpm typecheck`, `pnpm lint`,
  `pnpm format:check`, `pnpm build`. Todo verde.
- [ ] **Paso 2:** con `pnpm dev`, revisar en escritorio y a 375px de ancho, tema claro y oscuro:
  - **Sandbox**: conectores, ganador resaltado, penales, "En juego", "A confirmar" en los
    huecos de cuartos, puntos de un pronóstico cargado a mano.
  - **Clausura**: los 8 octavos con horario, cuartos a final "A confirmar", con conectores.
  - **Apertura**: el cuadro completo **sin** conectores.
  - **Mundial**: arranca en 16avos.
  - Teclado: Tab llega a los tabs, las flechas cambian de ronda, el foco se ve.
- [ ] **Paso 3:** pasarle a Lucas lo que vio y lo que no pudo verificar.
- [ ] **Paso 4:** actualizar CLAUDE.md: la sección de navegación menciona `/playoffs`; agregar
  que `match_number` en playoffs es la posición en el cuadro y que el cuadro se dibuja sin
  conectores si los cruces no cierran. Commit `docs: el cuadro de playoffs y match_number`.

---

## Fuera de este plan

- Renumerar los octavos del Apertura para que tenga conectores (8 `update` en producción;
  decisión aparte).
- La vista "Importar fecha" con preview desde una API.
- Corregir los estados de `rounds` desincronizados.
