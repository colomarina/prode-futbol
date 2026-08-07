# Pruebas — Fase 3a (TanStack Query)

Checklist para validar la rama `refactor/fase-3a-react-query` antes de mergear.
Es descartable: se puede borrar una vez mergeada.

## Qué cambió

Se reemplazó el patrón de fetching (`useState` + `useEffect`) por TanStack Query
en **`useRounds`, `useMatches`, `usePlayoffs`**, más un `useMatchesMeta` nuevo
que unifica la consulta de "todos los partidos del torneo".

Esto toca **todas las pantallas**, porque `useRounds` es la base del selector de
fechas de casi todas.

Además, los torneos con slug `test-` ahora solo los ven los admins.

**Riesgo alto:** Playoffs y Admin → Fechas son los que más se reescribieron.

---

## Preparación

1. Crear el torneo de prueba en Supabase (`tournaments`):
   - `slug` empezando con `test-` (ej. `test-sandbox`)
   - `status` = `'active'` — **obligatorio**, cualquier otro valor lo vuelve solo lectura
2. Cargar fechas (`rounds`) y partidos (`matches`) con ese `tournament_id`,
   siguiendo la tabla de escenarios de abajo.
3. Tener a mano una cuenta **no admin** para las verificaciones de visibilidad.

### Escenarios de tiempo a cargar

Los tiempos se calculan contra la hora actual, así que estos `match_date` hay
que ajustarlos al momento de probar.

| Fecha | `match_date` | Estado esperado |
|---|---|---|
| 1 | hace 5 h, `is_finished = true`, con resultado | Cerrada. **Sí** aparece en Cargar Resultados |
| 2 | hace 1 h | Pronósticos cerrados. **No** aparece en Cargar Resultados (< 2 h) |
| 3 | un partido en 5 min, otro en 40 min | El de 5 min cerrado, el de 40 min abierto |
| 4 | en 3 días | Pronósticos abiertos, caso normal |
| 5 | `is_playoff = true`, `playoff_stage` cargado | Bracket y predicción de clasificado |

---

## Checklist

### 1. Deduplicación de queries — en local

Correr `pnpm dev`. Abajo a la izquierda aparece el botón de React Query.

- [ ] Abrir las devtools y entrar a cualquier pantalla
- [ ] Hay **una sola** entrada `rounds` por torneo, no varias repetidas
- [ ] Hay **una sola** entrada `matches, meta` por torneo
- [ ] Todas las keys empiezan con el id del torneo
- [ ] Al entrar a Admin → Fechas, la entrada `matches, meta` **no** se duplica
      (antes esa consulta se hacía por separado en 3 lugares)

### 2. Pronósticos

- [ ] Cambiar de fecha varias veces, rápido
- [ ] Nunca se ven los partidos de la fecha anterior mezclados
- [ ] No hay un parpadeo de "no hay partidos" al cambiar de fecha
- [ ] Los pronósticos ya cargados aparecen al volver a una fecha
- [ ] Cargar y guardar un pronóstico funciona
- [ ] En la fecha 3, el partido a 5 minutos está bloqueado y el de 40 abierto

### 3. Tabla de Posiciones

- [ ] Carga correctamente
- [ ] El selector de fechas tiene todas las opciones
- [ ] Cambiar entre General, una fecha puntual y Playoffs funciona

### 4. Playoffs — **riesgo alto**

- [ ] El bracket se ve completo, con todas las etapas cargadas
- [ ] Los pronósticos propios aparecen en cada partido
- [ ] La predicción de clasificado (en empates) se ve bien

### 5. Admin → Fechas — **riesgo alto**

- [ ] Cambiar el estado de una fecha funciona
- [ ] ⚠️ El cambio ahora se refleja **después** de recargar del servidor, no
      instantáneo. Puede haber un instante de demora: es esperado
- [ ] El progreso de jugadores carga bien
- [ ] El conteo de partidos por fecha (`3/5` terminados) es correcto

### 6. Admin → Resultados

- [ ] La fecha 1 aparece en el selector; la fecha 2 no
- [ ] Con el torneo recién creado y sin partidos viejos, aparece el cartel
      🕒 "Todavía no hay fechas para cargar"
- [ ] Cargar un resultado funciona
- [ ] **Después de cargar**, ir a Admin → Fechas: el contador de partidos
      terminados de esa fecha subió **sin recargar la página**

### 7. Torneos de prueba

- [ ] Como admin, el torneo `test-` aparece en el selector
- [ ] Con la cuenta **no admin**, el torneo `test-` **no aparece por ningún lado**
- [ ] Si el usuario no admin tiene un solo torneo real, no le aparece
      "Cambiar torneo" en el menú hamburguesa

### 8. Cambio de torneo

- [ ] Cambiar entre dos torneos no muestra datos del anterior
- [ ] Las fechas, partidos y pronósticos corresponden al torneo seleccionado

---

## Señales de alarma

Si aparece alguna de estas, **no mergear**:

- Datos de un torneo apareciendo en otro
- El selector de fechas vacío en una pantalla donde antes había fechas
- Los pronósticos guardados no se ven al volver a una fecha
- El bracket de playoffs incompleto o sin pronósticos
- Un panel de admin que queda cargando para siempre

---

## Qué no cubre esta prueba

- **Volumen real de datos.** Con 5 fechas no se ve si algo se degrada con el
  historial completo del torneo real.
- **El scoring.** Lo calcula Supabase; conviene confirmar que la función que
  escribe `round_scores` filtre por `tournament_id`, o los puntos de prueba
  podrían contaminar la tabla real.
- **RLS**, salvo que se pruebe con una cuenta no admin.
