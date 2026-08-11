# Pruebas — Fase 3b (TanStack Query, parte 2)

Checklist para validar la rama `refactor/fase-3b-react-query`.
Descartable una vez mergeada.

**Requiere que la Fase 3a esté mergeada o validada**: esta rama sale de aquella.

## Qué cambió

Se migraron los cinco hooks que faltaban: **`usePredictions`, `useLeaderboard`,
`usePersonalStats`, `useAllPredictions`, `useWorldCupBonus`**. Ya no queda
ningún `useEffect` de fetching en `src/hooks/`.

Además se memoizaron los `value` de `TournamentContext` y `ThemeContext`.

**Riesgo alto:** `useAllPredictions` (tenía cuatro efectos de fetch y bastante
estado de UI entrelazado) y `useWorldCupBonus` (cinco RPC).

---

## Resultado

**Todo verificado menos la sección 5, que se dejó en TODO a propósito.**

Se probó manejando la app con Playwright sobre `test-sandbox`, con el seed de
`docs/pruebas-fase-3b.sql`, interceptando los requests al REST de Supabase para
poder afirmar sobre los datos que recibe la app y no sobre el texto en pantalla.
En todas las corridas: **0 consultas sin `tournament_id`, 0 a otro torneo, 0
excepciones de JS**.

| Sección | Resultado |
|---|---|
| 1. Pronósticos — escrituras | ✅ (ver el hallazgo del cutoff) |
| 2. Tabla de posiciones | ✅ |
| 3. Estadísticas personales | ✅ |
| 4. Todas las predicciones | ✅ (hizo falta un fix) |
| 5. Mundial | 🚫 TODO deliberado |
| 6. Playoffs | ✅ |
| 7. General | ✅ |

**Escrituras (sección 1).** Guardar dispara `POST predictions` + `GET predictions`:
la mecánica nueva —invalidar y releer— funciona. Los valores quedan en pantalla
sin recargar, persisten al salir y volver a la sección **con 0 requests** (salen
del cache), sobreviven a una recarga real de la página, y editar y volver a
guardar los actualiza.

**Puntos (sección 2).** Los calculó el servidor y la pantalla los reproduce
exactamente. La general quedó `La Coloneta 6`, `95 centavos 5`, `CEF 2`,
`Cubilla 2`, `Los Crotos 1`, y coincide con la suma de las filas de
`round_scores` por fecha. Los totales son coherentes con el esquema de
`InfoPage/info.config.jsx`: pleno con más de 2 goles = cantidad de goles (el 2-1
exacto dio 3), pleno con 2 o menos = 2 puntos (el 0-0 exacto dio 2), acertar
ganador/empate = 1.

**Jugadores ocultos.** Verificado a nivel dato: la API devuelve a `Popi`
(Ezequiel Cordoba) con 5 puntos y la UI lo filtra de la tabla —donde habría
empatado el segundo puesto— y también de "Todas las predicciones". El selector de
usuarios lista 20 de los 25 perfiles: faltan exactamente los 5 ocultos.

**Estadísticas (sección 3).** `Total de puntos 6`, `1° de 5 participantes`,
`promedio 3.0`, `precisión 100%`. La posición y el total de participantes
coinciden con la tabla general, que es el casillero que importaba.

**Todas las predicciones (sección 4).** Las dos vistas funcionan, cambiar de vista
limpia la selección anterior y cambiar de fecha limpia el partido elegido. Un
partido que todavía no empezó muestra "Los pronósticos de rivales se muestran
cuando el partido ya empezó" y **no se pide ni el request**: la query queda
deshabilitada por `enabled`. El selector de fechas solo ofrece las que tienen al
menos un partido empezado (la fecha 3, con todos por jugar, no aparece).

**Torneos reales (el "volumen real" que pedía este checklist).** Los tres hooks de
agregación que esta rama reescribió se abrieron en modo lectura contra
`clausura-2026` (7 jugadores con puntos) y `mundial-2026` (20 en la tabla, 8 fechas,
104 partidos): tabla general, una fecha puntual, playoffs, estadísticas personales
y "todas las predicciones". Todo carga, nada vacío, **0 escrituras** en esa pasada.
En el Mundial, `101 pts` y `6°` en Estadísticas coinciden con la fila 6 de la tabla.

⚠️ **Observación preexistente:** en `mundial-2026` la tabla muestra **20** filas y
Estadísticas dice "de **17** participantes". `usePersonalStats` cuenta `user_id`
distintos en `round_scores` (misma línea en `main` y acá, no lo cambió esta rama),
mientras que la tabla de un torneo `world_cup` sale de
`get_tournament_leaderboard_with_bonus`, que además incluye a quien tiene puntos de
bonus sin haber pronosticado partidos. La **posición** sí coincide; lo que difiere
es el total. Solo se manifiesta en torneos mundialistas, así que va con el resto de
la deuda del bonus.

**General (sección 7).** Se recorrieron las 12 pantallas: ninguna vacía, ninguna
con error, ninguna colgada en "Cargando". El único error de consola es un
deprecation warning de `@tippyjs/react`, que en React 19 accede a `children.ref`
(lo usa `Common/InfoButton`); es preexistente e idéntico en `main`. Cambiar el
tema conserva el torneo, y cambiar de torneo no arrastra datos del anterior.

## Hallazgos

**Se arregló: el 👀 de la tabla de posiciones no llevaba a ninguna parte.**
`useAllPredictions` aplicaba `initialUser` solo si `viewMode` ya era `'by-user'`,
y el modo arranca en `'by-match'`: nada lo cambiaba, así que el jugador nunca se
seleccionaba. La fecha sí llegaba, porque va por `useState`. Es preexistente
—idéntico en `main`—, no lo introdujo esta rama.

**Se arregló: guardar con el plazo vencido ya no pasa en silencio.** El filtro de
`PredictionForm` (`matches.filter(canPredictMatch)`, evaluado con el reloj del
click) descartaba el partido vencido sin decir nada: si era el único que habías
cargado, apretar Guardar **no hacía absolutamente nada**, ni un toast. Ahora avisa,
y solo por lo que el usuario cambió de verdad — hay que comparar contra el
pronóstico guardado porque `MatchPrediction` siembra `predictionValues` con lo ya
almacenado, y mirar solo "si hay valores" contaba partidos que nadie tocó, incluido
alguno ya jugado y con resultado cargado.

Las tres ramas se verificaron corriendo el reloj de la página hacia adelante, que
es fiel al escenario: no hay contador en vivo, así que el input sigue habilitado y
el descarte ocurre recién al guardar.

| Escenario | Mensaje | Escribe |
|---|---|---|
| Se venció el único que cargaste | "El plazo venció mientras cargabas: ese pronóstico no se guardó." | no |
| Cargaste varios y venció uno | "N pronósticos guardados correctamente. Otro quedó afuera porque venció el plazo." | sí |
| Nada venció | "N pronósticos guardados correctamente" | sí |

**Se borraron `createPrediction` y `updatePrediction`.** No las llamaba nadie, y
`createPrediction` era el único lugar con una revalidación del cutoff contra la
fecha real del partido: tenerla ahí daba a entender que la capa de datos protegía
el cierre de pronósticos cuando en realidad no corría nunca.

**Queda pendiente, y no es de esta rama: el cutoff sigue siendo una convención de
la UI.** Las policies de `predictions` solo chequean `user_id = auth.uid()`, sin
ninguna condición de tiempo, así que con la sesión de cualquier usuario se puede
insertar un pronóstico para un partido ya terminado. Hacerlo cumplir de verdad
pide un trigger `BEFORE INSERT OR UPDATE` en `predictions`, con dos costos a
considerar: rompe los seeds de prueba (que insertan sobre partidos jugados) salvo
que se exceptúe a los admins, y duplica `PREDICTION_CUTOFF_MINUTES`, que hoy vive
solo en `utils/matchTiming.js`. Merece su propio PR.

---

## Checklist

### 1. Pronósticos — escrituras

Es donde más cambió la mecánica: antes las escrituras parcheaban el estado
local a mano, ahora invalidan y vuelven a leer.

- [ ] Cargar pronósticos de una fecha y guardar
- [ ] Los valores guardados siguen ahí después de guardar
- [ ] Salir de la sección, volver, y verificar que persisten
- [ ] Editar un pronóstico ya cargado y guardar de nuevo
- [ ] Intentar guardar en un partido con menos de 10 minutos para el inicio:
      tiene que rechazarlo con el mensaje correspondiente

### 2. Tabla de Posiciones

- [ ] Tabla general: los puntos totales son correctos
- [ ] Una fecha puntual: los puntos de esa fecha son correctos
- [ ] Playoffs, si el torneo tiene
- [ ] En el Mundial, la tabla con bonus incluido
- [ ] Los jugadores ocultos no aparecen en ninguna variante

### 3. Estadísticas personales

- [ ] Cargan sin error
- [ ] La posición actual coincide con la Tabla de Posiciones
- [ ] El total de participantes coincide con la cantidad de filas de la tabla
- [ ] El gráfico de evolución de posición se ve bien
- [ ] Rachas, récords y desglose de aciertos tienen valores razonables

### 4. Todas las predicciones — **riesgo alto**

Probar las dos vistas y el cambio entre ellas.

- [ ] Vista **por partido**: elegir una fecha ya jugada y un partido; se ven los
      pronósticos de todos
- [ ] Vista **por usuario**: elegir una fecha y un jugador; se ven sus pronósticos
- [ ] Cambiar de vista limpia la selección anterior (no quedan datos colgados)
- [ ] Cambiar de fecha limpia el partido seleccionado
- [ ] Una fecha **que todavía no empezó** no aparece en el selector
- [ ] Un partido que todavía no empezó no muestra los pronósticos ajenos
- [ ] Entrar desde la tabla de posiciones con "ver predicciones" de un jugador
      abre la vista por usuario con ese jugador ya seleccionado

### 5. Mundial — ⚠️ TODO, SE DEJÓ SIN PROBAR A PROPÓSITO

**Decisión: no se prueba en esta fase.** El próximo mundial es en 2030 y el único
torneo `world_cup` de la base (`mundial-2026`) está `finished`, así que las
escrituras de admin no se pueden ejercitar sin tocar datos reales. Hay un
`TODO(mundial)` en `src/hooks/useWorldCupBonus.jsx` con la misma lista.

**`useWorldCupBonus` se mergea migrado pero sin validar contra la app.** Es la
deuda conocida de esta rama. Antes de que el bonus se vuelva a usar hay que
crear un torneo de prueba con `type = 'world_cup'`, `status = 'active'` y su fila
en `world_cup_bonus_config`, y recorrer esto:

- [ ] El formulario de bonus carga con los valores ya guardados
- [ ] Guardar una respuesta funciona y persiste al recargar
- [ ] Admin: cambiar la configuración de bloqueo
- [ ] Admin: forzar el bloqueo
- [ ] Admin: cargar resultados oficiales
- [ ] Admin: recalcular bonus. **Después**, ir a la Tabla de Posiciones y
      verificar que los puntos se actualizaron sin recargar la página — es el
      casillero que prueba que la invalidación alcanza a la query del leaderboard
      con bonus
- [ ] El contador de pronósticos cargados del panel admin es correcto

Lo que **sí** queda cubierto del lado mundialista: la tabla de posiciones de
`mundial-2026` se abrió en modo lectura durante la fase 3a y carga bien, con las
ramas propias del tipo `world_cup` en el selector.

### 6. Playoffs

- [ ] El bracket se ve completo
- [ ] Los pronósticos propios aparecen

### 7. General

- [ ] Cambiar de torneo no muestra datos del anterior en ninguna pantalla
- [ ] Cambiar el tema claro/oscuro sigue funcionando y respeta el color del torneo
- [ ] Navegar entre todas las secciones sin errores en la consola

---

## Señales de alarma

Si aparece alguna, **no mergear**:

- Un pronóstico que se guarda pero no se ve al volver
- Una pantalla que queda cargando para siempre
- La posición de Estadísticas distinta de la de la Tabla
- Datos de un jugador apareciendo bajo otro en "Todas las predicciones"
- Puntos del bonus que no se reflejan tras recalcular

---

## Qué no cubre

- **Volumen real.** `useLeaderboard` y `usePersonalStats` se lucen con historial
  largo; el torneo de prueba no lo tiene. Conviene una mirada en el torneo real
  antes de mergear.
- **Concurrencia entre usuarios**, salvo que se pruebe con dos sesiones abiertas.
