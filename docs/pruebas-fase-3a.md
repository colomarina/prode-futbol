# Pruebas — Fase 3a (TanStack Query)

Validación de la rama `refactor/fase-3a-react-query`. **Resultado: todo verificado.**
Es descartable: se puede borrar junto con `pruebas-fase-3a.sql` una vez mergeada.

## Qué cambió

Se reemplazó el patrón de fetching (`useState` + `useEffect`) por TanStack Query
en **`useRounds`, `useMatches`, `usePlayoffs`**, más un `useMatchesMeta` nuevo
que unifica la consulta de "todos los partidos del torneo". Además, los torneos
con slug `test-` ahora solo los ven los admins.

## Cómo se probó

Sobre la base real, con dos torneos de prueba (`test-sandbox` y `test-vacio`)
creados con `docs/pruebas-fase-3a.sql`, manejando la app con Playwright.

En vez de mirar las devtools de React Query a ojo, se interceptaron los requests
al REST de Supabase. Así "hay una sola entrada en el cache" se vuelve **"hubo
exactamente 1 GET a `/rest/v1/rounds` en toda la navegación"**. Sobre cada
corrida se corrieron además tres aserciones:

- ninguna consulta a `rounds`, `matches` o `round_scores` sin `tournament_id`
- ninguna consulta a un torneo que no sea el activo
- ningún error de JS en la consola

**Total: 0 violaciones en ~145 requests.**

---

## Resultados por sección

### 1. Deduplicación de queries

| Consulta | Requests al arrancar |
|---|---|
| `rounds` | 1 |
| `matches` (meta) | 1 |
| `matches` (fecha activa) | 1 |
| `predictions` | 1 |

Entrar a **Administración** y de ahí a **Admin → Fechas** dispara **0** requests a
`rounds` y `matches`: se sirven del cache. La consulta que antes se hacía por
separado en tres lugares (`useRounds`, `MatchManager`, `RoundManager`) ahora
tiene un solo request con **dos observers**.

De rebote quedó a la vista el contraste: con el StrictMode de dev, los hooks que
**no** están migrados duplican sus consultas (`tournaments` ×2, `profiles` ×3, la
RPC de progreso ×2), y los migrados no.

### 2. Pronósticos

Selector con las 5 fechas. Seis cambios de fecha seguidos: **0 apariciones** del
cartel "no hay partidos" (medido con un `MutationObserver`, no a ojo) y sin
partidos de la fecha anterior mezclados. Guardar dispara un solo `POST
predictions` y los valores siguen ahí al ir a otra fecha y volver.

### 3. Tabla de posiciones

General, una fecha puntual y Playoffs cambian sin error, con 1 `rounds` + 1
`round_scores` por cambio. El selector no ofrece la fecha 17 como fecha suelta
porque `LeadboardHeader` la agrupa en la solapa Playoffs.

### 4. Playoffs

Bracket completo: cuartos (4), semifinal (2) y final (1).

⚠️ **El detalle del pronóstico solo se ve abajo de 1024px.** Arriba de ese ancho,
`PlayoffBracket` cambia a la llave compacta, que por diseño muestra únicamente
los nombres de los equipos: ni resultado, ni "Tu pronóstico", ni el ✅. Probar
esta sección en desktop da un falso negativo.

En mobile, sobre el cuarto de final que quedó 1-1: `En penales clasifica:
Aldosivi` / `Clasificó: Aldosivi` / `Tu pronóstico: 1 - 1` / `Elegiste que
clasifica: Aldosivi ✅`.

### 5. Admin → Fechas

Cambiar el estado de una fecha funciona (`PATCH rounds` + refetch). El progreso
de jugadores carga por la RPC con scope. Contadores por fecha correctos.

El cambio de estado pasa por un `confirm()`, detalle que importa si se
automatiza: un driver que rechaza los diálogos hace que el panel parezca roto.

### 6. Admin → Resultados

El selector ofrece **Fecha 1, Fecha 6 y Cuartos de final** (las que tienen
partidos con más de 2 h) y **no** la 2 ni la 3. Cargar un resultado funciona, y
al volver a **Fechas** el contador pasó de `0/4` a `1/4` **sin recargar la
página**: la mutación invalida `matchesMeta`. En `test-vacio` aparece el cartel
🕒 "Todavía no hay fechas para cargar".

### 7. Torneos de prueba

Con la cuenta **no admin** (`test-colo`): no ve ningún `test-` en el selector ni
en "Cambiar torneo", no tiene la sección Administración, y **forzar
`test-sandbox` por localStorage lo expulsa** al selector.

Nota: el ocultamiento es del lado del cliente. La policy `tournaments_select_all`
es `true` para `public`, así que la base sí le devuelve la fila del torneo de
prueba. Funciona como UI, no como seguridad.

### 8. Cambio de torneo

`test-sandbox` ↔ `test-vacio` sin rastros del otro, y cada request con su propio
`tournament_id`.

### Scoring de punta a punta

Pronóstico 2-1 → resultado 2-1 → `predictions.points = 3` → fila en
`round_scores` → 🥇 La Coloneta 3 pts en la tabla. Confirmado además que
`update_prediction_points` arma `round_scores` con el `tournament_id` del
partido, así que **los puntos de prueba no contaminan la tabla real**.

---

## Bugs encontrados y corregidos

**BUG-1 — al recargar, un torneo de prueba expulsaba al admin al selector.**
Intermitente (2 de 3 recargas). El guard de `App.jsx` corre en cada render,
también mientras se muestra el spinner: si la lista de torneos resolvía antes que
el perfil, `isAdmin()` todavía era `false` y el torneo se veía como inaccesible,
así que lo limpiaba y borraba `active_tournament_slug`. Se espera a que termine
de cargar la sesión. Rompía justo la feature que agregó esta rama.

**BUG-2 — al arrancar se pedía la última fecha del torneo.** Regresión de
`bbc2c20`. `getNextActiveRoundNumber` cae a `Math.max(round_number)` cuando la
lista de partidos está vacía; al pasar las dos consultas a paralelo, `rounds`
podía resolver antes que `matchesMeta` y la fecha activa salía como la última del
torneo. `PredictionForm` pedía sus partidos y sus pronósticos y después saltaba a
la correcta: dos round-trips al vacío y un salto visible en cada carga. La
versión encadenada calculaba la fecha activa con las dos respuestas ya en la
mano. Arreglado en `useRounds` (devuelve `null` mientras cargan los partidos) y
en `PredictionForm`, que tenía su propio fallback al mismo número por otra vía.
Cubierto con un test en `useRounds.test.jsx`.

## Mejora incluida

El conteo de partidos por fecha vivía solo dentro del botón "Finalizar (x/y)",
que aparece nada más cuando la fecha está bloqueada. Ahora hay un badge `⚽ x/y`
en todas las fechas: una fecha finalizada muestra `2/2` y una pendiente `2/7`,
que antes no mostraban nada.

---

## Qué no cubre esta prueba

- **Volumen real de datos.** Con 5 fechas no se ve si algo se degrada con el
  historial completo del torneo real.
- **RLS más allá de la lectura.** Se probó con una cuenta no admin, pero no se
  intentó forzar escrituras contra las policies.
- **Los puntos de los partidos pre-sembrados.** `update_prediction_points` es
  `AFTER UPDATE` sobre `matches`: los partidos que el seed inserta ya terminados
  nunca disparan el cálculo, así que quedan en 0 pts (se ve en el cuarto de final
  del bracket). No es un problema de la app; para calcularlos hay que tocar el
  partido con un UPDATE.
- **Un bug de la base que quedó arreglado de paso**, ver el bloque `1.c` del SQL:
  `validate_single_open_round` contaba las fechas abiertas de toda la base sin
  filtrar por torneo, así que una fecha abierta en el sandbox le impedía al
  torneo real abrir la suya.
