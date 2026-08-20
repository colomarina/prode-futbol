# Pruebas — Fase 8 (UX y accesibilidad)

Registro de la rama `refactor/fase-8-ux-accesibilidad`. Descartable una vez mergeada.

**Sale de `refactor/fase-5-design-system`** (que ya tiene las fases 6 y 7 mergeadas) y
vuelve ahí al terminar, igual que las anteriores.

Estado: `lint`, `format:check`, `typecheck`, `test` y `build` en verde.
Tests: **414 → 464** en **48 → 52** archivos.

**Verificado en el navegador contra la base real**, con sesión de admin, midiendo
estilos computados y el árbol de accesibilidad de Chrome. Los resultados están en
"Lo que se midió" más abajo; lo que queda por mirar a ojo, en "Qué probar a mano".

---

## Los commits

| Commit | Qué |
| --- | --- |
| `fix: los escudos dejan de anunciarse dos veces...` | 7 `alt` redundantes a `""`, `loading="lazy"` en los de listas |
| `refactor: MatchResult usa los tokens...` | los 22 literales con token exacto |
| `test: SelectDropdown tiene tests...` | 14 casos sobre el contrato que ya existía |
| `feat: SelectDropdown es un listbox de verdad...` | roles, teclado y el nombre accesible; 14 → 31 tests |
| `feat: pronosticos, resultados y bonus...` | `<form onSubmit>` en las tres pantallas + 21 controles sin nombre |
| `feat: los errores de carga ofrecen reintentar...` | `Common/ErrorMessage` en 5 pantallas más |
| `feat: la tabla de posiciones y los pronosticos cargan con esqueleto` | `Common/Skeleton` y los dos esqueletos |
| `fix: la cajita del marcador muestra donde esta el foco` | el anillo de foco de `ScoreInput` |
| `fix: cuatro cosas que solo se vieron midiendo en el navegador` | lo que salió de la verificación |
| `feat: los tabs tienen las esquinas de arriba redondeadas` | `--radius-md` solo arriba |
| `refactor: los 4 literales que quedaban en MatchResult...` | salen de la tarjeta gemela |
| `docs: se cierran los tres pendientes que quedaban abiertos` | tabs, literales y el commit rojo |
| `fix: los campos de texto vuelven al minimo tactil de 44px` | lo que salió de auditar mobile |

Ningún commit de la rama queda en rojo. El de los tests de `SelectDropdown` marca
con `it.fails` el caso que documenta el bug, así que la suite pasa y el bug queda
igual de escrito; el commit siguiente lo arregla y lo vuelve un `it` normal.

---

## Tres cosas del plan que no eran así

El plan de la fase 8 se había escrito contra una lectura del código, y tres de sus
puntos no se sostuvieron al abrir los archivos. Quedan acá porque el plan viejo sigue
existiendo y conviene que no vuelvan a "arreglarse" al revés.

### 1. Los `alt=""` de `PlayoffBracket` estaban bien

El plan decía que ahí «el escudo es el único identificador visible del equipo, así
que el alt vacío esconde información». No: `teamNameStyle` renderiza el nombre al
lado del escudo, y el recorte es solo visual (`text-overflow: ellipsis`), así que el
texto completo está en el DOM y un lector de pantalla lo lee igual.

Lo que sí había era el problema **inverso**, y en siete lugares: `alt={team.name}`
con el mismo nombre escrito visible al lado, o sea anunciado dos veces. Esos pasaron
a `alt=""`.

Los únicos dos que se quedan con el nombre en el `alt` son los de `renderButton` en
`MatchSelector`: ahí el único texto es "vs", así que el escudo sí es el único
identificador. La asimetría está comentada en el archivo.

### 2. Los tamaños de letra de `MatchResult` sí están en la escala

La nota de la fase 6 decía que `0.75rem`, `0.8rem`, `0.85rem` y `0.9rem` estaban
fuera de la escala y que migrarlos era un cambio visual. Contra `tokens.css`, tres de
los cuatro son coincidencia **exacta** con `--font-size-xs`, `-sm` y `-md`.

De los 28 literales del archivo, **22 tienen token exacto** y su reemplazo no cambia
un pixel. Los otros 6 se resolvieron después, con un criterio mejor que la cercanía
(ver "Los 4 literales de `MatchResult`" más abajo); solo uno sigue siendo literal, y
no por falta de token.

### 3. `refetch` no estaba «disponible en todos los hooks»

Cuatro ya lo exponían con nombre propio (`fetchLeaderboard`, `fetchPlayoffs`,
`fetchData`, y `refetch` en `useMatchesMeta`), pero `usePersonalStats` no devolvía
ninguno: ahora expone `fetchStats`. Y `useAllPredictions` **no devuelve `error` en
absoluto**, así que esa pantalla no tiene estado de error que cablear — es un hueco
del hook, no de la pantalla, y queda anotado para la fase 10.

---

## Los bugs que aparecieron

Ninguno se buscó. Los tres de acá salieron de abrir los archivos para hacer otra
cosa; hay cuatro más que solo aparecieron midiendo en el navegador, y están en "Lo
que se midió".

### `SelectDropdown` nunca anunciaba el valor elegido

`aria-labelledby` **pisa** el contenido del botón. Apuntando solo al label, el nombre
accesible del disparador era "Equipo" con el equipo elegido invisible: se anunciaba
la pregunta y nunca la respuesta, en los 8 lugares que usan el componente.

Ahora apunta a dos ids —el del label y el del propio botón— y el nombre queda
"Equipo River". Lo encontró un test que se escribió antes de tocar nada.

### 21 controles sin nombre accesible en las dos pantallas mundialistas

- `WorldCupPredictions` tenía un `<label className="form-label">` suelto, sin asociar
  a nada: sus 13 controles no tenían nombre.
- `AdminWorldCupBonus` usaba `FormField group`, que está para varios controles bajo
  una etiqueta. Ahí cada rama de `question.type` tiene uno solo, así que nombraba al
  grupo y dejaba el control adentro sin nombre. El comentario que lo justificaba
  hablaba de radios que no existen en esa pantalla.

Las dos pasaron al mismo patrón: los dropdowns se nombran con su prop `label` y los
campos de texto con `FormField` común. **Es visualmente neutro**: el `.label` de
`SelectDropdown` y el de `FormField` replican `.form-label`, y los 8px de separación
salen del `margin-bottom` en un caso y del `gap` en el otro.

### La cajita del marcador no mostraba el foco

`ScoreInput` declara `outline: none`. Lo pisa la regla global `input:focus` de
`index.css` —(0,1,1) le gana a (0,1,0)—, pero lo único que esa regla hace es
`border-color: var(--color-primary)`, y el tono `.primary` **ya tiene ese mismo
color** en el borde. O sea: en un pronóstico vacío, que es el caso normal, enfocar el
control más usado de la app no cambiaba un solo pixel.

Los otros cinco `outline: none` del proyecto se revisaron y están cubiertos.

---

## Lo que se midió

Playwright sobre el Chromium de Playwright, con la app corriendo en `pnpm dev` y una
sesión de admin real. Para lo que había que comparar contra el estado anterior se
levantó un segundo server sobre un worktree en `f41df7f`, que es el commit previo a
los cambios de esta fase.

**Ojo con el segundo server**: los dos comparten `node_modules` por una junction, así
que comparten también `node_modules/.vite`. El segundo re-optimiza las dependencias
encima del primero y la app del primero termina recibiendo otra copia de React:
`/admin/horarios` reventó con `Cannot read properties of null (reading 'useRef')` en
`react-datepicker`. **No era un bug de la app.** La solución es darle al segundo
server su propio `cacheDir` con un config aparte. Vale anotarlo porque el método del
worktree está recomendado más arriba y este es su filo.

### Diffs contra el estado anterior: 0 diferencias

| Qué | Cómo | Resultado |
| --- | --- | --- |
| `MatchResult` en `/admin/partidos`, fechas 4 y 5 | 63 nodos, 27 propiedades computadas cada uno, nodos identificados por contenido | **0 diferencias** |
| Las 14 etiquetas de `/mundialistas` | geometría, separación etiqueta/control y 11 propiedades | **0 diferencias** |

Los dos casos son los que se prometieron "visualmente neutros", así que 0 era el
resultado esperado y por eso se verificó el medidor antes de creerle:

- En `/admin/partidos` se confirmó que los dos puertos estaban en la misma ruta, con
  15 tarjetas de `MatchResult`, la misma fecha y el mismo primer partido.
- En `/mundialistas` el **primer** medidor dio 6 diferencias por pregunta —tamaño de
  letra, peso, `marginBottom`— y todas eran falsas: el selector agarraba el wrapper
  del widget en el código nuevo (donde la etiqueta vive adentro) y el `<label>` en el
  viejo. O sea comparaba nodos distintos, que es exactamente lo que pasó en la fase 6.
  Corregido a "de los nodos que contienen `(N pts)`, el de texto más corto", las
  diferencias se fueron a 0.

### Accesibilidad, medida con el árbol de Chrome (no con jsdom)

| Dónde | Antes | Ahora |
| --- | --- | --- |
| Selector de fecha | — | `"📅 Seleccioná una Fecha Fecha 6"`, sin el `▼` |
| Dropdowns de `/mundialistas` | `"Paises Bajos ▼"` | `"Campeon del Mundial (8 pts) Paises Bajos"` |
| Campos de texto de `/mundialistas` | `"Respuesta"` (el placeholder) | `"Maximo goleador (5 pts)"` |
| Marcador de un partido | el nombre del equipo **dos veces** | una sola vez |
| Cajitas del marcador | `textbox "-"` las dos | `textbox "Goles de Aldosivi"` |

La asimetría de `MatchSelector` quedó confirmada como correcta: el nombre de su
disparador es `"⚽ Seleccionar Partido #1 - Rosario Central vs Aldosivi"`, y esos dos
nombres salen justo de los `alt` que **no** se vaciaron. Sin ellos el botón habría
dicho "Partido #1 - vs".

Los escudos: 16 de 30 pedidos al cargar la pantalla. El `loading="lazy"` difiere los
de abajo del pliegue.

### Teclado del `SelectDropdown`, en el navegador

Con 16 fechas: `ArrowDown` abre, el foco arranca en la elegida (Fecha 6, la que tiene
`aria-selected="true"` de 16 opciones), las flechas mueven en orden de DOM y dan la
vuelta, `End` va a la última y `Home` a la primera, `Escape` cierra y **el foco vuelve
al disparador**, `Tab` cierra y sigue al control siguiente sin atrapar. La opción
enfocada muestra `outline: solid 1.6px` del primario, que se lo da el
`button:focus-visible` global.

### El anillo de foco del marcador

Medido con y sin foco en la cajita:

```
sin foco:  borderColor rgb(30, 127, 67)   boxShadow  0 2px 8px rgba(0,0,0,.08)
con foco:  borderColor rgb(30, 127, 67)   boxShadow  0 2px 8px rgba(0,0,0,.08),
                                                     0 0 0 3px primario/.35
```

El `borderColor` es **idéntico** en los dos estados, que es la confirmación de que el
bug era real: antes de esta fase eso era lo único que cambiaba, o sea nada.

De paso apareció que `box-shadow` no se acumula entre reglas y la de `:focus-visible`
borraba la elevación de `.box`; ahora la repite.

### El salto de los esqueletos

Con la consulta retenida para poder medir el estado de carga estable:

| Pantalla | Alto del documento | Salto | El selector se movió |
| --- | --- | --- | --- |
| `/posiciones` | 826 → 835 px | **9 px** | no |
| `/pronosticos`, con `CANTIDAD = 4` | 1026 → 3610 px | 2584 px | no |
| `/pronosticos`, con la cantidad de `useMatchesMeta` | 3143 → 3593 px | 450 px | no |
| `/pronosticos`, más los dos altos corregidos | 3294 → 3593 px | **299 px** | no |

Las tarjetas, una por una: el esqueleto mide 172 px y las reales 172, 178 y 192.4.
La suma de las 15 difiere **80 px**. Lo que queda es irreducible: el alto de la fila
del marcador lo manda el nombre de equipo más largo —"Aldosivi" deja la columna en
44.4 px, "Unión de Santa Fe" corta en dos líneas y la deja en 58.8—, y eso depende de
datos que todavía no llegaron. Los 219 px restantes del documento son `RoundSummary` y
la barra de guardar, que aparecen recién con los datos cargados.

El `role="status"` anuncia "Cargando los partidos de la fecha..." y "Cargando la tabla
de posiciones...". En ninguna de las dos pantallas se movió el selector de fecha, que
era el objetivo.

### Temas y `prefers-reduced-motion`

Las cuatro combinaciones, entrando por el `localStorage` del tema (no por
`data-theme` a mano: el tema del torneo escribe la paleta **inline en el root**, así
que un `setAttribute` no la cambia — el primer intento de medir esto dio los valores
del tema oscuro para los dos).

`reduce` apaga la animación **y** el gradiente en los dos temas. Y el brillo se
cambió por lo medido: con `--color-surface` daba 1.04 de contraste en claro (`#fafafa`
sobre `#ffffff`, invisible) y en oscuro iba para el lado contrario; con
`--color-border` queda en 1.26 y 1.23.

### Lo demás

- **Enter guarda y no recarga.** Verificado en `/pronosticos` abortando la escritura,
  así que no se guardó nada: el `POST` sale con el payload correcto
  (`home_prediction: 2, away_prediction: 1` en el partido correcto) y un centinela en
  `window` sobrevive, o sea que no hubo recarga. **Detalle a saber**: con un solo
  marcador cargado el botón está deshabilitado y Enter no hace nada, porque el
  navegador no envía cuando el submitter por defecto está deshabilitado. Es coherente
  —no se puede guardar nada— pero conviene tenerlo escrito.
- **El botón de reintentar funciona de punta a punta.** Forzando un 500 en la consulta
  de playoffs: aparece el aviso con "Reintentar", el click dispara una consulta nueva,
  llega el contenido y el error desaparece.
- **El datepicker de `/admin/horarios`**, que la fase 7 arregló sin poder verlo:
  `flex: 1 1 0%` aplicado en los 15 campos, y anulando la regla en runtime el input
  pasa de **264.4 px a 176 px**. O sea que el arreglo sirve y antes estaba roto.
- **El emoji por torneo de la fase 7** también quedó confirmado de paso: el selector
  muestra 🏆 ⚽ 🏆 🌍 ⚽ y no cinco pelotas.

---
---

## Qué probar a mano

Ocho de los diez puntos que este documento pedía al principio quedaron verificados
midiendo en el navegador (ver "Lo que se midió"). Lo que sigue es lo que una
medición **no** puede decidir: si algo se ve bien.

### Lo que queda por mirar

Casi nada, y todo chico. Tres de los cuatro juicios que este documento pedía se
cerraron midiendo, no opinando:

- **¿El anillo de foco se distingue del borde verde?** *No tiene caso.* El tono verde
  (`success`) sale de `is_finished`, que es la misma condición del `disabled`, y el
  gris (`muted`) de `!canEditResult`, ídem. En `MatchPrediction` el modo lectura ni
  siquiera renderiza un input. Censado: 30 inputs `primary` enfocables en pronósticos,
  30 `success` **todos deshabilitados** en el panel de resultados. El anillo solo
  aparece sobre el tono primario, que ya está medido. Queda escrito en
  `ScoreInput.module.css` para que no cambie en silencio.
- **¿El anillo queda apretado en mobile?** *No.* A 375 px va de 116 a 172 px con la
  cajita de al lado arrancando en 206: sobran 34 px.
- **El brillo del esqueleto.** Ya no es una pregunta abierta sino una preferencia: con
  `--color-border` da 1.26 y 1.23 de contraste en los dos temas, contra 1.04 y 1.12
  que daba antes. Si te parece mucho o poco, es cambiar un token. **Deuda, no
  pendiente.**

Lo único que sigue siendo un juicio de verdad:

1. **El esqueleto de `/pronosticos` en una fecha con avisos.** Con nombres de equipo
   cortos el esqueleto y la tarjeta miden lo mismo (172 px los dos). Con avisos de
   partido cerrado o selector de penales la tarjeta real crece y el esqueleto queda
   corto. El selector de fecha no se mueve en ningún caso, así que el salto es hacia
   abajo: decidir si molesta o no.

### Lo que no se pudo verificar desde acá

- **El lector de pantalla queda descartado.** Un lector consume el árbol de
  accesibilidad, que es exactamente lo que se midió con Chrome: nombres, roles y
  estados están verificados uno por uno (ver "Lo que se midió"). Escucharlo con NVDA
  solo agregaría matices de fraseo, así que no justifica la instalación.
- **Un torneo `finished`** (modo consulta): que el `<form>` nuevo no habilite nada.
  El guard de `isReadOnly` sigue en `handleSaveAll`, pero conviene verlo.

### Detalle de comportamiento que conviene saber

Con **un solo** marcador cargado, el botón de guardar está deshabilitado y **Enter no
hace nada**: el navegador no envía el formulario cuando el submitter por defecto está
deshabilitado. Es coherente —no hay nada que guardar— pero es distinto de "Enter
siempre guarda".

---

## Lo que queda pendiente

### Los 4 literales de `MatchResult`: resueltos

Quedaron sin token exacto y estaban anotados como una decisión visual pendiente. Se
resolvieron, y el criterio **no fue "el token más cercano"** —que entre dos pasos de
la escala es una moneda al aire— sino **qué usa `MatchPrediction` para lo mismo**: es
la tarjeta del mismo partido, con la misma grilla `1fr auto auto auto 1fr` y el mismo
panel de penales, y ya tenía un token para cada uno.

| `MatchResult` (literal) | `MatchPrediction`, para lo mismo | Por cercanía habría salido |
| --- | --- | --- |
| `gap: 10px` | `gap: var(--space-md)` (12) | 8 o 12, a la suerte |
| `marginBottom: 20px` | `margin-bottom: var(--space-xl)` (24) | **16**, distinto |
| `margin: 0 0 10px 0` del título de penales | `margin: 0 0 var(--space-md) 0` en `QualifierPicker` | 8 o 12 |
| `fontSize: 0.85rem` ×2 | `--font-size-sm` en el hint equivalente | **0.9rem**, distinto |

Medido: cada tarjeta pasa de **196.1 a 198.8 px** y las 15 juntas de 2927.6 a 2968.4.
Horizontalmente **no se mueve nada**: el gap de 10 a 12 se lo comen las columnas
`1fr` y la columna de equipo sigue en 80 px.

Queda **un** literal en el archivo, el `marginTop: 36px` del bloque de fecha, y no
por falta de token: no es espaciado, es la altura libre para pasar por debajo de los
dos badges absolutos, así que sale de la geometría de esos badges. Y es una
duplicación: `MatchHeader.module.css` tiene el mismo `36px` en `.meta` por el mismo
motivo, porque las dos tarjetas implementan por su cuenta el patrón "badge absoluto
arriba + contenido corrido". Se va cuando `MatchResult` use `MatchHeader`.

### Los tabs

Lucas los veía muy rectos y recordaba que antes tenían las puntas redondeadas. En la
historia del repo **nunca las tuvieron**: los `border-radius` que hay atrás en
`Navigation` son de badges y del botón de cerrar sesión, y el `TabButton` original
tampoco tenía radio. Así que no era una regresión de la fase 5.

Se agregó igual, porque la forma del componente lo pide: borde de 1px en tres lados y
acento de 4px abajo es la pestaña de una carpeta, y una pestaña se apoya en el borde
del contenido. Va `var(--radius-md) var(--radius-md) 0 0` — arriba redondeadas, abajo
rectas. Verificado a 4x en los dos temas, en activo y en hover, y a 430 px de ancho.

### Lo que no entró en la fase

- **`useAllPredictions` no expone `error`.** Es lo que impide darle a "Ver
  pronósticos" un estado de error accionable como al resto. Va con la fase 10, que ya
  toca los hooks.
- **La duplicación de la regla del clasificado por penales.** `MatchResult`
  reimplementa inline lo que `MatchPrediction/qualifier.ts` ya tiene con tests. No son
  idénticas —el formulario muestra el selector solo si hay empate, el panel lo muestra
  siempre y lo deshabilita—, así que unificarlas cambia la UI del admin: es una
  decisión de producto, no un refactor.
- **`QualifierPicker` es un `radiogroup` con dos tab stops.** El patrón canónico de
  APG es un solo tab stop con flechas moviendo la selección. No está roto —los dos
  botones se alcanzan y se anuncian—, pero no es el patrón. Cambiarlo altera la
  interacción, así que queda como nota.
- **`/admin/mundial` quedó sin abrir. Deuda, nada más.** `AdminRoute` exige torneo no
  finalizado y el único torneo tipo Mundial está en `finished`. Sus etiquetas
  comparten el patrón con `/mundialistas`, que **sí** se verificó con 0 diferencias,
  y el resto de la pantalla no lo tocó esta fase. Se mira cuando haya un Mundial
  activo; no vale mover un torneo de estado para verla.
- **El área táctil del `InfoButton`** (39×32.5, por debajo de la recomendación de 44
  pero por encima del mínimo WCAG de 24). El intento de agrandarla sin tocar el
  tamaño visible está documentado arriba, en "Mobile".
