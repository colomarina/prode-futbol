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

### 5. Mundial — **riesgo alto** (si aplica)

- [ ] El formulario de bonus carga con los valores ya guardados
- [ ] Guardar una respuesta funciona y persiste al recargar
- [ ] Admin: cambiar la configuración de bloqueo
- [ ] Admin: forzar el bloqueo
- [ ] Admin: cargar resultados oficiales
- [ ] Admin: recalcular bonus. **Después**, ir a la Tabla de Posiciones y
      verificar que los puntos se actualizaron sin recargar la página
- [ ] El contador de pronósticos cargados del panel admin es correcto

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
