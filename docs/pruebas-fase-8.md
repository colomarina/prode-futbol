# Pruebas — Fase 8 (UX y accesibilidad)

Registro de la rama `refactor/fase-8-ux-accesibilidad`. Descartable una vez mergeada.

**Sale de `refactor/fase-5-design-system`** (que ya tiene las fases 6 y 7 mergeadas) y
vuelve ahí al terminar, igual que las anteriores.

Estado: `lint`, `format:check`, `typecheck`, `test` y `build` en verde.
Tests: **414 → 456** en **48 → 51** archivos.

---

## Los siete commits

| Commit | Qué |
| --- | --- |
| `fix: los escudos dejan de anunciarse dos veces...` | 7 `alt` redundantes a `""`, `loading="lazy"` en los de listas |
| `refactor: MatchResult usa los tokens...` | 22 de 28 literales a tokens; los 6 que quedan, comentados |
| `test: SelectDropdown tiene tests...` | 14 casos sobre el contrato que ya existía |
| `feat: SelectDropdown es un listbox de verdad...` | roles, teclado y el nombre accesible; 14 → 31 tests |
| `feat: pronosticos, resultados y bonus...` | `<form onSubmit>` en las tres pantallas + 21 controles sin nombre |
| `feat: los errores de carga ofrecen reintentar...` | `Common/ErrorMessage` en 5 pantallas más |
| `feat: la tabla de posiciones y los pronosticos cargan con esqueleto` | `Common/Skeleton` y los dos esqueletos |
| `fix: la cajita del marcador muestra donde esta el foco` | el anillo de foco de `ScoreInput` |

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
un pixel. Los 6 que quedan afuera se dejaron como literales con el motivo escrito al
lado, y son una decisión visual pendiente (ver más abajo).

### 3. `refetch` no estaba «disponible en todos los hooks»

Cuatro ya lo exponían con nombre propio (`fetchLeaderboard`, `fetchPlayoffs`,
`fetchData`, y `refetch` en `useMatchesMeta`), pero `usePersonalStats` no devolvía
ninguno: ahora expone `fetchStats`. Y `useAllPredictions` **no devuelve `error` en
absoluto**, así que esa pantalla no tiene estado de error que cablear — es un hueco
del hook, no de la pantalla, y queda anotado para la fase 10.

---

## Los bugs que aparecieron

Ninguno se buscó: los tres salieron de abrir los archivos para hacer otra cosa.

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

## Qué probar a mano

La rama no se puede cerrar sin esto: el foco, el layout shift y el comportamiento con
datos reales no se ven desde los tests.

### Con la cuenta de prueba (`test-colo`, no admin)

1. **`/pronosticos`, recorrido completo con teclado.** Tab desde el principio:
   - El selector de fecha se abre con `Enter` **y con las flechas**; adentro, las
     flechas mueven, `Home`/`End` van a los extremos, `Escape` cierra y el foco
     vuelve al selector, `Tab` cierra y sigue de largo.
   - **En cada cajita de marcador tiene que verse el anillo de foco** (lo nuevo). Es
     el punto más importante: mirar los tres tonos, el vacío, el ya cargado (verde) y
     el de solo lectura.
   - Con algo tipeado, `Enter` desde cualquier cajita tiene que **guardar** y no
     recargar la página.
   - En un partido de playoff empatado, los dos botones de "quién clasifica" tienen
     que ser alcanzables y mostrar foco.
2. **El esqueleto de `/pronosticos`.** Recargar y mirar el momento de la carga: el
   selector de fecha tiene que estar visible desde el principio, con las tarjetas
   grises debajo. **Medir el salto**: la tarjeta real cambia de alto si hay aviso de
   cerrado o selector de penales, así que en una fecha con avisos el esqueleto queda
   más corto. Si el salto molesta, decidirlo ahí.
3. **El esqueleto de `/posiciones`.** Igual: el header y el selector no tienen que
   parpadear, y la fila de títulos de la tabla tiene que estar desde el principio.
4. **Los dos temas y los dos torneos**, porque el esqueleto usa colores de la paleta.
5. **`prefers-reduced-motion`** activado: el brillo del esqueleto tiene que apagarse y
   quedar el bloque plano.
6. **Con un torneo `finished`** (modo consulta): el `<form>` nuevo no tiene que
   habilitar nada; el guard de `isReadOnly` sigue en `handleSaveAll`.
7. **Un lector de pantalla**, aunque sea NVDA por cinco minutos, en `/posiciones`:
   con una fecha elegida el selector tiene que anunciar "Fecha 4" y no solo "Fecha".

### Con la cuenta de admin (esto solo lo podés hacer vos)

8. **`/admin/horarios`: el ancho del datepicker.** Es lo que quedó de la fase 7: se
   arregló con `.react-datepicker-wrapper { flex: 1 }` y nunca se vio. Confirmar que
   el campo de fecha ocupa el ancho disponible.
9. **`/admin/partidos`.** Es la pantalla que más cambió sin cambiar de aspecto:
   - `MatchResult` migró 22 literales a tokens, así que **tiene que verse idéntico**.
     Cualquier diferencia acá es un token mal elegido.
   - `Enter` desde un marcador tiene que guardar los resultados.
   - Forzar un error de carga (modo avión un segundo y recargar) y ver que aparece el
     aviso con **botón de reintentar**, no el texto pelado.
10. **`/admin/mundial`**: las etiquetas de las 13 preguntas tienen que verse en el
    mismo lugar y con el mismo tamaño que antes. Es el cambio que más "no debería
    verse" de todos.

---

## Lo que queda pendiente

### Los 4 literales de `MatchResult` que son una decisión visual

Ninguno tiene token exacto, así que elegir uno **cambia la pantalla**. Están
comentados en el archivo con el motivo:

| Literal | Dónde | Entre qué tokens cae |
| --- | --- | --- |
| `marginTop: 36px` | bloque de fecha | No es espaciado: es lo que hace falta para pasar por debajo de los dos badges absolutos. `--space-2xl` (32px) los pisa |
| `marginBottom: 20px` | grilla del marcador | `--space-lg` (16) y `--space-xl` (24) |
| `gap: 10px` y `margin: 0 0 10px 0` | grilla y título de penales | `10px` es el valor que `tokens.css` excluyó a propósito. En la grilla son 4 gaps, así que moverlo cambia 8px el ancho total: hay que mirar el mobile |
| `fontSize: 0.85rem` ×2 | dos textos de estado | Justo en el medio de `--font-size-sm` (0.8) y `-md` (0.9) |

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
