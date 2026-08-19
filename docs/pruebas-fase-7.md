# Pruebas — Fase 7 (TypeScript)

Registro de la rama `refactor/fase-7-typescript`. Descartable una vez mergeada.

**Sale de `refactor/fase-5-design-system`** (que ya tiene la fase 6 mergeada) y vuelve
ahí al terminar, igual que las anteriores.

---

## Qué cambió

`src/` entero: **157 archivos**. Los únicos `.js` que quedan son los tests y sus dos
helpers.

| Capa | Archivos | Lo que aportó |
|---|---|---|
| Herramientas | tsconfig, ESLint, CI, `pnpm typecheck`, `pnpm types:db` | El build no chequea tipos: sin un paso propio, la fase no daba seguridad |
| `types/` | `database.ts` (generado) + `domain.ts` + `results.ts` | El esquema real como fuente |
| `utils/` | 17 | El contrato de las estadísticas, que era implícito |
| `lib/` | 3 + `vite-env.d.ts` | Las variables de entorno dejan de ser `any` |
| `hooks/` | 14 | Los selects verificados contra el esquema |
| `contexts/` | 3 | Eran la dependencia de raíz de los hooks |
| `components/` | 105 | Props tipadas contra los tipos de los hooks |

Tests: **414**, los mismos de antes. La migración no agregó ni sacó ninguno.

---

## Lo que encontró el tipado

Nada de esto se buscó: son cosas que aparecieron porque el compilador las marcó.

### Un bug de verdad

**`MatchPredictionsByUser` llamaba `hasMatchStarted(match)`** pasando el objeto del
partido, cuando esa función espera la fecha. `new Date(objeto)` es Invalid Date y
cualquier comparación con NaN da `false`, así que `started` era **siempre falso** y
todas las tarjetas de "Ver Pronósticos → por jugador" se renderizaban con la
opacidad de "no empezó". Los otros cinco llamadores ya pasaban `match.match_date`.

Es el único cambio de comportamiento de la fase, y está medido más abajo.

### Cinco props que no hacían nada

| Dónde | Prop | Qué pasaba |
|---|---|---|
| `InfoButton` → Tippy | `touch: ['mouseenter', 'touchstart']` | La opción acepta `boolean \| 'hold' \| ['hold', number]`; esos son valores de `trigger`. Se comportaba como el default |
| `DateTimeInput` → `DatePicker` | `style={{ width: '100%' }}` | react-datepicker no acepta `style`: el ancho completo nunca se aplicó |
| `LeaderboardRow` → `InfoButton` | `position="top"` | La prop se llama `placement`: el globito del jugador suspendido siempre salió a la derecha |
| `routes` → `PersonalStats` | `activeSection="personal"` | Esa pantalla no recibe props |
| `PlayoffBracket` | `getColumnStyle(stageIndex)` | La función no tiene parámetros: hubo una versión que variaba por ronda y la llamada quedó |

Las cinco se sacaron **sin cambiar comportamiento** (eran no-ops) y quedaron
documentadas en el archivo. En tres de ellas la intención original se puede
recuperar, pero eso mueve píxeles y es una decisión aparte:

- el globito del suspendido arriba, con `placement="top"`
- el input del datepicker al 100%, por `className`
- **el emoji de cada torneo en el selector**: `TournamentCard` leía
  `tournament.emoji`, y la tabla `tournaments` **no tiene esa columna** —el emoji
  vive en `config/tournaments.config.ts`—, así que todas las tarjetas mostraron
  siempre la pelota genérica. Sale de `getTournamentConfig(tournament.slug)?.emoji`.

### Siete tipos escritos a mano que estaban mal

Se habían "verificado contra la base" consultando unas filas de cada tabla, y eso
alcanza para los **nombres** de las columnas pero **no para la nulabilidad**: tres
filas de muestra no pueden mostrar que una columna acepta null.

| Columna | A mano | Real |
|---|---|---|
| `matches.is_finished` | `boolean` | **`boolean \| null`** |
| `matches.tournament_id` | `Uuid` | **`string \| null`** |
| `rounds.tournament_id` | `Uuid` | **`string \| null`** |
| `predictions.points` | `number` | **`number \| null`** |
| `round_scores.total_points` | `number` | **`number \| null`** |
| `profiles.full_name` | `string` | **`string \| null`** |
| `teams.logo_url` | `string \| null` | **`string`** (al revés) |

Las tres primeras importan: `is_finished` decide qué fecha tiene tabla propia y qué
partido entra en las estadísticas, y los dos `tournament_id` nullables son la
columna de la que depende **toda** la separación entre torneos. Que el esquema
permita una fecha o un partido sin torneo es material para la fase 9.

### Cosas que estaban implícitas y ahora están escritas

- **El contrato de las estadísticas.** La forma la definía el literal `emptyStats` y
  la pantalla leía `stats.metrics.totalPoints` de memoria. Ahora está en
  `utils/stats/types.ts` y `emptyStats` está anotado, así que si el contrato gana un
  campo el literal deja de compilar.
- **El payload del upsert de pronósticos** estaba duplicado entre `savePredictions` y
  `usePredictions`, cada uno describiéndolo en su comentario. Ahora es
  `PredictionUpsertInput` y los dos lo comparten.
- **`menu.config` declaraba dos variantes de `type` y hay tres**:
  `change_tournament` lo arma `Sidebar` en runtime.
- **La tabla de posiciones sale de tres fuentes** (agregación local, vista
  `general_leaderboard`, RPC con bonus) que la UI trata igual. Escribir
  `LeaderboardEntry` mostró en qué se diferencian: `bonus_points` solo viene de la
  RPC, y el `id` de la vista **puede ser null**.
- **El guard de `useAuth` era código muerto**: con `createContext({})`, un objeto
  vacío es truthy, así que usar el hook afuera del provider no explotaba. Y
  `TournamentContext` era peor: `createContext()` sin argumento lo tipa como
  `undefined`, que después del guard queda en `never`, y sobre `never` **cualquier**
  propiedad compila.

### Contratos que el tipado no puede verificar, y están anotados

- `fetchRoundScoresByRounds` arma su select con una condición, así que supabase-js
  no puede inferir la forma (para eso el string tiene que ser literal). Es el único
  lugar de la capa de datos donde el tipo es una declaración y no una verificación.
- `get_personal_stats` devuelve `Json`: `normalizeStats` es lo único que garantiza
  la forma, y de ahí el único cast de esa cadena.

---

## Verificación

### Automática, en cada commit

`pnpm lint`, `pnpm typecheck`, `pnpm format:check`, **414 tests** y `pnpm build`, en
verde en los 13 commits.

Dos controles negativos, porque un "0 errores" no prueba nada si el chequeo no está
mirando:

- Se metió un error de tipos a propósito en un `.ts` y `tsc` lo atajó.
- Se le sacó una columna al select de `useMatchesMeta` y **no compiló**
  (`Type '{...4 campos}' is not assignable to 'MatchMeta[]'`), y se le puso un
  `Promise<number[]>` al de `useMatches`: el error mostró que supabase-js infiere la
  fila completa con los tres equipos embebidos. O sea que la anotación del `queryFn`
  de verdad ata el select al tipo.

### En el navegador, contra el estado anterior a la fase

Mismo método que la fase 6: worktree en `ee03de8` (el merge de la fase 6) servido en
`:5199`, la versión migrada en `:5174`, sesión copiada entre orígenes. El diff es del
**árbol completo**: cada nodo bajo `#root` con 58 propiedades computadas,
`getBoundingClientRect`, la altura del documento y el texto, abortando si los dos
lados no están en el mismo tema/torneo/ruta.

| Ruta | Nodos | Diferencias |
|---|---|---|
| `/pronosticos` (Clausura, claro 1280) | 636 | 0 |
| `/posiciones` | 498 | 0 |
| `/rivales` (por partido) | 484 | 0 |
| `/estadisticas` | 610 | 0 |
| `/reglas/puntos` · `/desempates` · `/estado-partidos` | 410 · 420 · 395 | 0 |
| `/perfil` | 400 | 0 |
| `/admin/partidos` · `/fechas` · `/horarios` | 636 | 0 (redirige: la cuenta no es admin) |
| `/pronosticos` (Mundial, modo consulta) | 449 | 0 |
| `/posiciones` (Mundial) | 691 | 0 |
| `/playoffs` (Mundial) | 1170 | 0 |
| `/mundialistas` | 492 | 0 |
| `/estadisticas` (Mundial) | 611 | 0 |
| `/pronosticos` · `/posiciones` (oscuro, 390px) | 636 · 498 | 0 |
| `/playoffs` (Mundial, oscuro, 390px) | 1170 | 0 |

**19 rutas, 0 diferencias.** Los 8 errores de consola son los mismos en las dos
versiones (el aviso de `element.ref` de React 19, preexistente).

Y el único caso donde se esperaba una diferencia:

| Caso | Resultado |
|---|---|
| `/rivales` → **por jugador** | **15 diferencias, todas `opacity: 0.6 → 1`** sobre nodos con clase `_card_ _noEmpezado_`. Cero cambios de geometría, de texto y de estructura (732 nodos en las dos versiones) |

O sea: el arreglo hace exactamente lo que tenía que hacer y nada más.

### Lo que no se verificó en el navegador

- **Los tres paneles de `/admin/*` con una sesión de admin.** La corrida usó la
  cuenta de prueba, que no es admin, así que esas tres rutas verifican el guard
  (redirigen igual en las dos versiones) y no el panel en sí. Para cubrirlos hace
  falta que alguien se loguee como admin.
- **Escrituras.** No se guardó ningún pronóstico ni resultado en esta corrida: la
  fase no tocó la forma de ningún payload (el del upsert quedó atado por tipo entre
  productor y consumidor), y el guardado real se había ejercitado en la fase 6.
- **Las pantallas mundialistas de escritura** (`AdminWorldCupBonus`,
  `WorldCupPredictions` con el formulario habilitado): siguen sin poder probarse,
  por lo mismo que anota `useWorldCupBonus` desde la fase 3b.

---

## Lo que queda de la fase

Nada bloqueante. La deuda está medida y es la de `strict`:

| Flag | Errores | Estado |
|---|---|---|
| `strictFunctionTypes`, `strictBindCallApply`, `noImplicitThis`, `alwaysStrict` | 0 | **prendidas** |
| `strictPropertyInitialization` | 1 | pendiente |
| `useUnknownInCatchVariables` | 12 | pendiente |
| `noImplicitAny` | 100 | pendiente |
| `strictNullChecks` | 132 | pendiente |

Prender `strict: true` de una son **241 errores juntos**; conviene ir flag por flag
empezando por las dos chicas. Las cuatro que ya estaban en cero se prendieron para
que no puedan volver atrás.

Un dato para dimensionar `strictNullChecks`: cuando solo estaban migrados `utils/` y
`lib/`, esa flag daba **0** errores — esos módulos están escritos a la defensiva. Los
132 aparecieron con los hooks y los componentes, y 24 son un solo caso repetido: las
RPC del bonus del Mundial declaran sus 15 argumentos como `string` no nullable y el
cliente manda `null` para las preguntas sin responder. En SQL eso se acepta; el tipo
generado es más estricto que la función real, y probablemente se resuelva declarando
esos parámetros con `default null` en la base (fase 9).

Los tests siguen en `.js` a propósito: migrarlos es un trabajo de fixtures —un
fixture parcial falla por propiedades faltantes— y conviene hacerlo junto con
`strictNullChecks`, no antes.
