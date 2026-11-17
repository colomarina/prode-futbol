# Llave de playoffs en el celular: tarjetas horizontales y cuadro completo opcional

Aprobado el 2026-11-17.

## Por qué

En el celular, la llave muestra cada cruce con los dos equipos uno debajo del otro, como en el cuadro de
escritorio. El resto de la app ("Mis pronósticos") muestra los partidos en horizontal: local a la
izquierda, marcador al medio, visitante a la derecha. La llave tiene que verse como el resto de la app.
Además, alguien puede querer ver el cuadro entero en el celular.

## Qué se construye

1. **Tarjeta horizontal en las tabs del celular.**
   - Arriba: el estado (fecha · hora, "En juego", "Resultado pendiente" o "Final").
   - Al medio: escudo arriba y nombre abajo de cada equipo, con el marcador entre los dos si terminó o "vs"
     si no.
   - Ganador resaltado y perdedor atenuado, con el texto oculto "clasificado", igual que hoy.
   - "Clasificó por penales" cuando corresponde.
   - Abajo, la línea del pronóstico, sin cambios.
   - Un cruce sin cargar muestra de cada lado los escudos y "A o B", o "A confirmar".
2. **Botón "Ver cuadro completo" / "Ver por ronda"**, solo en el celular, arriba de las tabs.
   - En modo cuadro muestra el mismo cuadro de escritorio (conectores, columnas de 220px), con scroll
     horizontal dentro del recuadro y sin scroll horizontal de la página.

## No objetivos

- No cambia la vista de escritorio (desde 1024px).
- No cambian los datos, `buildBracket` ni la lógica de estados.
- La elección del modo no se recuerda: cada vez que se entra a la llave arranca por ronda. Lo decidió
  Claude y se puede cambiar.

## Enfoques considerados

- **Variante `layout` en `BracketMatchCard` (elegido).** Reusa toda la lógica de la tarjeta (estados,
  ganador, penales, pronóstico) y cambia solo la disposición.
- Una tarjeta nueva para el celular: duplicaría la lógica de estados y del pronóstico.
- Reusar el `MatchCard` de "Mis pronósticos": está atado a los inputs del formulario y no sabe de cruces
  sin cargar ni de ganadores.

## Criterios de aceptación

- En el celular, las tabs muestran tarjetas horizontales.
- El botón alterna entre la vista por ronda y el cuadro completo, con scroll horizontal.
- El escritorio se ve igual que antes.
- Tests: la tarjeta horizontal (marcador o "vs", estados, cruce sin cargar, pronóstico); el botón alterna
  las vistas; el celular arranca por ronda.
