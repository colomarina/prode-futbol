# Refactor: lo que queda (solo la fase 10; la 8 y la 9 quedaron cerradas)

Este documento existe para poder **arrancar una conversación nueva sin contexto
previo**. El plan original completo está en
`~/.claude/plans/te-animas-a-hacer-groovy-sutton.md` (fuera del repo), pero está
escrito contra el estado de hace 7 fases: varios de sus números y varios de sus
puntos ya no aplican. Acá está el estado **verificado** al cerrar la fase 8.

Registros por fase: `docs/pruebas-fase-3a.md`, `-3b`, `-4`, `-6`, `-7`, `-8`, `-9`.

---

## Estado al cerrar la fase 8

Rama actual: `refactor/fase-8-ux-accesibilidad`, sale de
`refactor/fase-5-design-system` (que ya tiene las fases 6 y 7 mergeadas).

**Estrategia de ramas acordada:** las fases 6 a 10 se mergean a la rama de la fase 5,
y esa es la que va a `main`. El motivo es que la fase 5 dejó cambios visuales chicos
que hay que revisar juntos al final, antes de mergear. Cada fase nace de
`refactor/fase-5-design-system` y vuelve ahí al terminar.

`main` no tiene ningún commit que la fase 5 no tenga, así que no hay divergencia.

Métricas verificadas:

|                                    | Valor                                |
| ---------------------------------- | ------------------------------------ |
| Tests                              | 464 en 52 archivos                   |
| Archivos `.ts`/`.tsx` (sin tests)  | 160                                  |
| Archivos `.js`/`.jsx` que quedan   | 2, los helpers de test               |
| Imports de Supabase en componentes | 0                                    |
| `useEffect` de fetching en hooks   | 0                                    |
| Deuda de `strict`                  | 241 errores en 4 flags (ver fase 10) |

La deuda de `strict` **no se volvió a medir** después de la fase 8: los tres
componentes nuevos están escritos con tipos, así que no debería haber subido, pero el
número de arriba es el de la fase 7 y hay que remedirlo al arrancar la 10.

`pnpm lint && pnpm typecheck && pnpm format:check && pnpm test && pnpm build` en
verde.

**Ojo con la métrica de líneas.** Al empezar la fase 6 había 12 archivos de más de
250 líneas y al cerrarla 7; ahora hay **11**. No es una regresión: la fase 7 les sumó
anotaciones de tipo y comentarios a los archivos que ya eran grandes
(`useWorldCupBonus` 208 → 289, `useLeaderboard` 210 → 267, `AuthContext` 211 → 263).
El conteo de líneas dejó de ser un buen proxy de complejidad: los que importan siguen
siendo los mismos de antes.

### `MatchManager/MatchResult`: resuelto en la fase 8

Era el punto que la fase 6 dejó abierto y la 8 lo cerró.

**La fase 6 se había equivocado en el diagnóstico.** Decía que `0.75rem`, `0.8rem`,
`0.85rem` y `0.9rem` no estaban en la escala y que por lo tanto migrarlos era un
cambio visual. Contra `tokens.css`, tres de los cuatro son coincidencia **exacta**
con `--font-size-xs`, `-sm` y `-md`. De los 28 literales del archivo, **22 tenían
token exacto** y se migraron sin cambiar un pixel.

Los otros 4 (6 ocurrencias) también se resolvieron, y el criterio **no fue "el token
más cercano"** —que entre dos pasos de la escala es una moneda al aire— sino **qué usa
`MatchPrediction` para lo mismo**: es la tarjeta del mismo partido, con la misma
grilla y el mismo panel de penales, y ya tenía un token para cada uno (`--space-md`
para el gap, `--space-xl` para el margen, `--space-md` para el título de penales,
`--font-size-sm` para los textos de estado). Por cercanía, dos de los cuatro habrían
salido distintos. Medido: cada tarjeta pasa de 196.1 a 198.8 px y nada se mueve
horizontalmente.

Queda **un** literal, el `marginTop: 36px` del bloque de fecha, y no por falta de
token: no es espaciado, es la altura libre para pasar por debajo de los dos badges
absolutos. Y es una duplicación con el mismo `36px` de `MatchHeader.module.css`.

Lo de "no es un god component" sigue valiendo: sus ~90 líneas de lógica ya delegan en
`utils/matchTiming`, `utils/score` y `utils/matchDate`, y partirlo solo movería markup
de un archivo a otro.

**Lo que sigue pendiente, porque es duplicación real y no cosmética:** `MatchResult`
reimplementa inline la regla del clasificado por penales —ganador automático,
bloqueo, efecto de sincronización— que `MatchPrediction/qualifier.ts` ya encapsula y
tiene con tests. No son idénticas: el formulario de pronósticos muestra el selector
**solo si el marcador es empate** (`shouldShowPicker`), y el panel de resultados lo
muestra siempre en un partido de playoff y lo deshabilita cuando hay ganador.
Unificarlas cambiaría la UI del admin y toca la escritura que dispara el scoring, así
que es una decisión de producto, no un refactor mecánico.

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

## Fase 8 — UX y accesibilidad: **terminada y verificada en el navegador**

Rama `refactor/fase-8-ux-accesibilidad`, catorce commits, **ninguno en rojo**. El detalle está en
`docs/pruebas-fase-8.md`.

Tests: **414 → 464** en **48 → 52** archivos. `lint`, `format:check`, `typecheck`,
`test` y `build` en verde.

**Verificado contra la base real con sesión de admin**, midiendo estilos computados y
el árbol de accesibilidad de Chrome. Lo importante:

- **`MatchResult` en `/admin/partidos`: 0 diferencias** (63 nodos × 27 propiedades,
  fechas 4 y 5). **Las 14 etiquetas de `/mundialistas`: 0 diferencias.** Los dos eran
  los cambios prometidos como "visualmente neutros".
- El salto del esqueleto de posiciones es de **9 px**; el de pronósticos bajó de
  **2584 a 299 px** al sacar la cantidad de tarjetas de `useMatchesMeta` en vez de una
  constante. Con nombres de equipo cortos, esqueleto y tarjeta miden lo mismo (172 px).
- El datepicker de `/admin/horarios` (pendiente de la fase 7) **funciona**: anulando
  la regla en runtime el input pasa de 264.4 a 176 px.
- El teclado del `SelectDropdown`, el Enter que guarda sin recargar y el botón de
  reintentar, verificados de punta a punta.

Y **cuatro bugs más que solo aparecieron midiendo**: los inputs del marcador no
tenían nombre accesible (`textbox "-"` los dos), el esqueleto de pronósticos
reservaba un cuarto del alto, el anillo de foco borraba la elevación de la cajita, y
el brillo del esqueleto era invisible en tema claro e invertido en oscuro.

**Mobile también está auditado**, con `isMobile`/`hasTouch` a 375, 390, 412 y 768 px
sobre cinco rutas y los dos torneos: cero desborde horizontal en todos, los dos
esqueletos entran, el anillo de foco del marcador aparece igual con teclado y después
de un tap, y la lista del dropdown y la tabla caben sin scroll propio. Salió un
arreglo: los campos de texto medían 40 px de alto porque `TextInput` pisaba el
`min-height: 44px` global con un valor que había entrado con los paneles de finanzas,
ya borrados.

Lo que queda es lo que una medición no puede decidir —si algo se ve bien— más un
lector de pantalla de verdad. La lista está en `docs/pruebas-fase-8.md`, sección "Qué
probar a mano".

### Lo que se hizo

- **`SelectDropdown` es un listbox de verdad.** Era el ítem más grande. `role="listbox"`
  y `role="option"` con `aria-selected`, y teclado completo: las flechas abren y
  mueven dando la vuelta en los extremos, `Home`/`End`, `Escape` cierra devolviendo el
  foco, `Tab` cierra sin atrapar. Foco móvil sobre los botones de las opciones, con
  `preventScroll` para no deshacer el centrado. **De 0 a 31 tests.**
- **Los tres formularios reales.** `PredictionForm`, `MatchManager` y
  `WorldCupPredictions` tienen `<form onSubmit>`, así que se guarda con Enter.
- **Los errores ofrecen reintentar.** `LeaderBoard/ErrorMessage` subió a
  `Common/ErrorMessage` y lo usan 5 pantallas más. En playoffs y en cargar resultados
  lo que había era un `EmptyState`, que además no ofrecía salida.
- **Esqueletos de carga.** `Common/Skeleton` más los de la tabla de posiciones y los
  pronósticos. Lo importante no es el gris: las dos pantallas devolvían un spinner en
  lugar de **todo** su contenido, así que ni el selector de fecha se veía.
- **Imágenes:** 7 `alt` redundantes a `""`, `loading="lazy"` en los de listas.
- **`MatchResult`:** 22 de sus 28 literales a tokens.

### Los siete bugs que aparecieron

Tres salieron de abrir los archivos:

- **`SelectDropdown` nunca anunciaba el valor elegido.** `aria-labelledby` pisa el
  contenido del botón: el nombre accesible era "Equipo" y el equipo elegido quedaba
  invisible, en los 8 lugares que lo usan. Lo encontró un test escrito antes de tocar
  nada.
- **21 controles sin nombre accesible** en las dos pantallas mundialistas: un `<label>`
  suelto sin asociar en una, y un `FormField group` mal usado en la otra.
- **La cajita del marcador no mostraba el foco.** El control más usado de la app: el
  `outline: none` lo pisa la regla global `input:focus`, pero lo único que esa hace es
  poner el borde en `--color-primary`, que es el color que el tono `.primary` **ya
  tiene**. En un pronóstico vacío, enfocar no cambiaba un pixel.

Y cuatro más aparecieron **solo al medir en el navegador**, con la fase ya verde en
tests. Es el argumento a favor de no cerrar una fase de UX sin abrir la app:

- **Los inputs del marcador no tenían nombre**: el árbol de accesibilidad los mostraba
  como `textbox "-"` los dos, porque el nombre salía del placeholder. Ahora llevan
  `aria-label` ("Goles de Aldosivi") y el separador pasa a `aria-hidden`.
- **El esqueleto de pronósticos reservaba un cuarto del alto**: la cantidad de
  tarjetas era una constante en 4 y las fechas tienen 15 partidos. Ahora sale de
  contar la fecha en `useMatchesMeta`, que ya está en cache.
- **El anillo de foco borraba la elevación de la cajita**: `box-shadow` no se acumula
  entre reglas y la de `:focus-visible` pisaba la de `.box` entera.
- **El brillo del esqueleto era invisible en claro e invertido en oscuro**, porque
  `--color-surface` es más claro que `--color-surface-variant` en un tema y más oscuro
  en el otro. Se cambió a `--color-border`.

### Tres puntos del plan que no eran así

Están explicados en `docs/pruebas-fase-8.md`; en resumen:

1. Los `alt=""` de `PlayoffBracket` **estaban bien** (el nombre sí se renderiza al
   lado). Lo que había era el problema inverso, en 7 lugares.
2. Los tamaños de letra de `MatchResult` **sí están en la escala**: 3 de los 4 son
   coincidencia exacta. 22 de los 28 literales se migraron sin cambiar un pixel.
3. `refetch` **no** estaba «disponible en todos los hooks». Cuatro lo exponían con
   nombre propio, `usePersonalStats` no devolvía ninguno (ahora sí, `fetchStats`), y
   `useAllPredictions` **no devuelve `error` en absoluto**.

También se descartó agregar atributos `width`/`height` a las imágenes: todas fijan las
dos dimensiones por CSS, así que el espacio ya queda reservado y no hay layout shift
que corregir. `loading="lazy"` sí suma.

### Lo que queda de la fase

- **Mirar a ojo lo que quedó en `docs/pruebas-fase-8.md`**, sección "Qué probar a
  mano". Ya no es una lista de verificación: es lo que una medición no puede decidir
  (si el anillo de foco se distingue en el tono verde, si el brillo del esqueleto
  molesta) más un lector de pantalla de verdad.
- **`/admin/mundial` quedó sin abrir: deuda y nada más.** `AdminRoute` exige torneo no
  finalizado y el único Mundial está en `finished`. Sus etiquetas comparten el patrón
  con `/mundialistas`, que sí se verificó con 0 diferencias, y el resto de la pantalla
  no lo tocó esta fase. Se mira cuando haya un Mundial activo; no vale mover un torneo
  de estado para verla.
- **El área táctil del `InfoButton`** (39×32.5: pasa el mínimo WCAG de 24, no la
  recomendación de 44). El intento de agrandarla sin tocar el tamaño visible, y por
  qué se revirtió, está en `docs/pruebas-fase-8.md`.
- **`useAllPredictions` no expone `error`**, así que "Ver pronósticos" no tiene estado
  de error que cablear. Va con la fase 10, que ya toca los hooks.
- **La duplicación de la regla del clasificado por penales** sigue en pie: unificarla
  cambia la UI del admin, así que es una decisión de producto. Y el mismo refactor se
  lleva puesto el último literal de `MatchResult`: el `marginTop: 36px` está duplicado
  en `MatchHeader` porque las dos tarjetas implementan por su cuenta el patrón "badge
  absoluto arriba + contenido corrido".
- **`QualifierPicker` es un `radiogroup` con dos tab stops** en vez del tab stop único
  con flechas que pide APG. No está roto; no es el patrón.

### Los tabs: no era una regresión

Lucas los veía muy rectos y recordaba las puntas redondeadas. En la historia del repo
**nunca las tuvieron** —los `border-radius` viejos de `Navigation` son de badges y del
botón de cerrar sesión—, así que no venía de la fase 5. Se agregó igual, arriba y no
abajo, porque el componente es la pestaña de una carpeta y una pestaña se apoya en el
borde del contenido.

Sirve como recordatorio para el resto de la revisión visual: **conviene confirmar
contra el historial antes de tratar algo como regresión de una fase.**

---

## Fase 9 — Supabase: **cerrada** (lo urgente hecho; el resto, deuda anotada)

Verificada empíricamente contra la base con la cuenta de prueba (RLS, triggers y las
RPC sueltas). Registro en `docs/pruebas-fase-9.md`; SQL aplicado y rollbacks en
`docs/plan-fase-9.md`.

### Hecho y verificado en producción (2026-08-20)

Las dos migraciones de seguridad —lo único con riesgo real— están aplicadas:

- **A1 — escalada de privilegios (era 🔴).** Un usuario común podía hacerse admin con
  `PATCH /profiles { role: 'admin' }`. Cerrado con el trigger
  `prevent_profile_role_change`: revierte el cambio de `role` cuando `auth.uid()` no
  es null (desde el panel/`service_role` sí se puede). Verificado: la escalada deja el
  rol en `user` y el cambio de `full_name` sigue andando.
- **A2 — `isReadOnly` era solo UI.** Se podía escribir un pronóstico en un torneo
  finalizado. Cerrado con dos policies restrictive en `predictions` que exigen torneo
  `active`. Verificado: en `finished` se rechaza, en `active` sigue igual.

Regresión OK: `matches`/`rounds` siguen rechazando a un no-admin, los pronósticos
ajenos dan `42501`, la lectura sigue pública.

También se **documentó la fórmula de puntos** (`calculate_points`, coincide con
`utils/stats/accuracy.ts`) y que **no hay trigger de scoring**: los puntos los escribe
un proceso que corre el admin al finalizar la fecha, no la escritura del pronóstico.

### Deuda que queda (decidido: no se hace ahora)

- **A3 — cutoff de pronósticos en la base: NO se hace.** El cierre de 10 minutos ya
  funciona en el cliente (`PredictionForm` + `canPredictMatch`) y está verificado.
  Ponerlo en la base es defensa en profundidad, pero el guardado es un batch: una
  policy que rechace una fila vencida puede tumbar el guardado entero, y el agujero
  solo se explota usando la API a mano. **No vale el riesgo.** Si algún día se retoma,
  el punto de entrada es `can_predict(match_id)`, que además está rota (le falta
  `set search_path`).

- **Entrega B — limpieza de esquema: en el cajón, "por si algún día pinta".** Nada de
  esto rompe nada hoy; es prolijidad, y los `DROP` tienen riesgo irreversible sin
  ganancia funcional. Queda anotado y sin fecha:
  - `matches.tournament_id` y `rounds.tournament_id` a `NOT NULL` (hoy son nullables;
    cero filas null, así que el ALTER no falla). Es lo más "sano" de la lista.
  - Borrar `matches.status` (columna muerta confirmada) — necesita revisar triggers
    en el panel primero.
  - Las 3 vistas que el cliente no usa (`general_leaderboard_by_tournament`,
    `leaderboard`, `round_leaderboard`) y la superficie muerta de pagos (4 tablas + 15
    funciones sin consumidor) — `DROP` de alto riesgo, revisar `pg_depend` antes.
  - Índices en `matches(tournament_id, round_number)` y
    `round_scores(tournament_id, round_number)` — inocuos, para cuando haya volumen.
  - Reducir `docs/supabase-schema.md` a lo que el generador no cubre (RLS, triggers,
    índices), para que no compita con `src/types/database.ts`.

  El SQL de cada una, con su rollback, ya está escrito en `docs/plan-fase-9.md` (entrega
  B). Cuando pinte, es aplicar y verificar regresión.

### Para limpiar cuando haya `service_role` a mano

- Dos pronósticos de prueba de `test-colo` que RLS no deja borrar al dueño: un `2-1`
  en `test-sandbox` y un `7-7` en `mundial-2026`. Inocuos.
- `test-vacio` quedó en `finished` para probar A2; se puede devolver a `active`.

---

## Fase 10 — `strict` y tests

Fase nueva, y **sale de la fase 7**: no es un pendiente olvidado, es trabajo que se
midió al terminar de migrar y que no entra ni en UX ni en Supabase.

### `strict`, flag por flag

`strict` es un paraguas de ocho flags. La fase 7 prendió las cuatro que ya daban
cero. Las otras cuatro, medidas con `tsc --noEmit --<flag>`:

| Flag                           | Errores | Notas                              |
| ------------------------------ | ------- | ---------------------------------- |
| `strictPropertyInitialization` | 1       | un rato                            |
| `useUnknownInCatchVariables`   | 12      | mecánico: estrechar en los `catch` |
| `noImplicitAny`                | 100     | callbacks y parámetros sin anotar  |
| `strictNullChecks`             | 132     | el grueso                          |

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

1. **Probar a mano la fase 8**, que es lo único que le falta:
   `docs/pruebas-fase-8.md`, sección "Qué probar a mano". Dos de los diez puntos
   necesitan sesión de admin.
2. Terminar la fase 10 y mergearla a `refactor/fase-5-design-system` (la 6, la 7 y la
   8 ya están, o van ahí).
3. **Revisar los cambios visuales juntos.** Están listados en
   `docs/pruebas-fase-6.md` (sección "Cambios visuales deliberados") y son los
   que motivaron la estrategia de ramas. Los de la fase 5 que quedaron señalados:
   texto secundario de `#757575` a `#666666`, títulos con el primario más oscuros,
   e ícono de estado vacío de 4rem a 3rem. **La fase 8 suma superficie nueva a esta
   revisión**: los dos esqueletos de carga y el anillo de foco del marcador son
   visibles a propósito, y el resto de sus cambios pretende ser neutro (los tokens de
   `MatchResult` y las etiquetas de las dos pantallas mundialistas).
4. `pnpm lint && pnpm format:check && pnpm test && pnpm build`.
5. Probar con un torneo `active` y uno `finished`: `isReadOnly` cambia el
   comportamiento de 6 componentes. La fase 8 le agregó `<form>` a tres pantallas de
   escritura, así que conviene confirmar que en modo consulta siguen sin escribir.

## Cómo se verifica un refactor visual en este proyecto

Lo que funcionó en la fase 6 y se volvió a usar en la 8:

1. `git worktree add <tmp> <commit-anterior>` y una junction a `node_modules`
   (`New-Item -ItemType Junction`), para no reinstalar. Copiar también el `.env`.
2. Un segundo `vite --port 5199` sobre ese worktree, **con su propio `cacheDir`**.
   Esto último es obligatorio y se aprendió a los golpes en la fase 8: la junction
   comparte `node_modules`, o sea también `node_modules/.vite`. El segundo server
   re-optimiza las dependencias encima del primero y la app del primero termina
   recibiendo otra copia de React: `/admin/horarios` reventó con
   `Cannot read properties of null (reading 'useRef')` en `react-datepicker`, y no
   era un bug de la app. Un config aparte lo resuelve:

   ```js
   // vite.diff.config.js, dentro del worktree
   import { defineConfig, mergeConfig } from 'vite'
   import base from './vite.config.js'
   export default mergeConfig(base, defineConfig({ cacheDir: './.vite-diff' }))
   ```

   Y si algo ya se rompió: matar los dos servers, borrar `node_modules/.vite` y
   levantar de nuevo.
3. Playwright sobre los dos puertos, copiando el `localStorage` de un origen al
   otro para llevar la sesión. Alcanza con lanzar un Chromium headed con
   `--remote-debugging-port`, que Lucas se loguee a mano una vez, y conectarse por
   `connectOverCDP`. `playwright-core` se instala fuera del repo para no tocar las
   dependencias del proyecto.
4. Medir `getComputedStyle` de los nodos identificables por contenido —no por
   posición en el DOM, que cambia a propósito— y **diffear**. Incluir `margin`:
   olvidarlo escondió el único hallazgo real de la fase 6.
5. Cuando un diff parece implausible, **arreglar el medidor antes de creerle**.
   En la fase 6, 15 de 17 diferencias eran un selector que apuntaba a nodos
   distintos en cada versión; en la fase 8 volvió a pasar exactamente igual con las
   etiquetas mundialistas, donde la etiqueta pasó a vivir adentro del widget y el
   selector agarraba el wrapper en una versión y el `<label>` en la otra.
6. **Y cuando el diff da 0, verificar el medidor también.** Confirmar que las dos
   versiones estaban en la misma ruta, con la misma cantidad de elementos y los
   mismos datos, antes de escribir "0 diferencias".

Dos cosas más que hacen falta y no son obvias:

- **Para medir un estado de carga hay que retenerlo.** `page.route` sobre la consulta
  que la pantalla espera, resolver a mano cuando ya se midió, y medir otra vez. Sin
  eso el estado de carga dura menos que el `waitForTimeout`.
- **El tema no se cambia con `setAttribute('data-theme')`.** El tema del torneo
  escribe la paleta **inline en el root**, y el inline le gana a cualquier hoja de
  estilos. Va por `localStorage.setItem('theme', ...)` antes de cargar la página.

## Torneos de prueba

No borrarlos: los slugs con prefijo `test-` son el mecanismo para probar contra la
base real sin tocar un torneo en curso, y solo los ven los admins.
