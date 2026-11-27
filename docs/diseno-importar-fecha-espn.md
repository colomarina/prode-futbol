# Diseño: importar fechas desde ESPN

Estado: **diseño aprobado en charla, falta el plan.** Fecha: 27/11/2026.

## Para qué

Hoy cada fecha se carga a mano en el panel de admin, partido por partido, y los horarios se
van confirmando durante la semana. La idea es que el admin apriete un botón, la app traiga
los partidos de ESPN, muestre **cómo quedaría la fecha** y recién al confirmar se guarde.

Se usa **cada semana, a medida que se confirman los horarios**: se carga lo confirmado y el
mismo botón se vuelve a apretar para completar o corregir.

### Objetivos

- Buscar la próxima fecha (o la fecha en curso, si está incompleta) en ESPN.
- Vista previa con equipos mapeados, día y hora, número de partido y avisos.
- Guardar solo al confirmar, todo junto o nada.
- Volver a correrlo en la semana: agrega lo nuevo y actualiza horarios cambiados.
- Solo admins.

### Fuera de alcance (por ahora)

- **Proponer resultados.** Viene después, con el mismo módulo. Los resultados nunca se cargan
  solos: los confirma el admin.
- **Dónde va el botón:** en la pantalla de Fechas (`RoundManager`, `/admin/fechas`), arriba del
  progreso de la fecha en juego. Se construye igual como un componente autocontenido.
- Correr solo, sin admin (cron). Si algún día se quiere, es el enfoque B de abajo.

### Lo que lo haría un fracaso aunque funcione

- Que guarde algo sin que el admin lo vea antes.
- Que cambie el horario de un partido cuyo pronóstico ya cerró: podría reabrir un partido
  después de que alguien vio el resultado.
- Que borre partidos o pronósticos. **El botón nunca borra nada.**
- Que numere un playoff por horario en vez de por posición en el cuadro (el error del Apertura).

## Prueba en vivo (27/11/2026)

Los cuartos del Clausura 2026 se cargaron así, a mano desde la terminal: ESPN trajo los 4
partidos (`season.slug = clausura---quarterfinals`), los cruces cerraron contra los ganadores
de octavos y se guardaron en una sola sentencia (fecha 18 "Cuartos de Final" en `pending` + 4
partidos). Los equipos salieron de los ganadores de octavos, no de los nombres de ESPN. Estos
partidos **no tienen el id de ESPN** (ver "Identidad de un partido").

## Lo que sabemos de ESPN

API no oficial, sin key: `https://site.api.espn.com/apis/site/v2/sports/soccer/arg.1/scoreboard?dates=YYYYMMDD`.

- Un día por pedido: un rango da 400.
- **Acepta pedidos desde el navegador** (`Access-Control-Allow-Origin: *`).
- "X at Y" = Y es local; mejor leer `competitors[].homeAway`.
- `event.id` es estable por partido y `team.id` es estable por equipo.
- **La etapa solo se marca en playoffs**: `clausura---quarterfinals`. En la fase regular todos
  los partidos dicen `torneo-clausura`, **sin número de fecha**.
- No hay un campo de "horario confirmado". `status.type.name` trae `STATUS_SCHEDULED`,
  `STATUS_POSTPONED`, `STATUS_FULL_TIME`, etc.
- Los nombres no coinciden con `teams` ("Instituto (Córdoba)", "Gimnasia La Plata").

## Enfoque

| | Dónde se consulta ESPN y se arma la vista previa | |
| --- | --- | --- |
| **A (elegido)** | En el navegador. Funciones puras en `src/utils/` + RPC de admin para guardar | Todo en el repo, en TS, con Vitest. Sin infraestructura nueva. Si ESPN cierra CORS, hay que mudar la consulta a un servidor |
| B | Edge Function de Supabase | No depende de CORS y sirve para un cron. Pero es Deno, fuera del repo, sin tests y con un deploy aparte |
| C | Script local | Descartado: tiene que ser un botón para el admin |

Se eligió **A** porque usa lo que el proyecto ya tiene y no cierra la puerta a B: si después
se quiere algo automático, se mudan las mismas funciones puras.

## Cómo funciona

### Flujo

1. El admin aprieta **"Buscar próxima fecha"**.
2. La app decide qué fecha buscar, consulta ESPN día por día y arma la vista previa comparando
   con lo que ya hay en la base.
3. El admin revisa, resuelve los equipos que no matchearon y aprieta **"Confirmar carga"**.
4. Una RPC guarda todo junto. Se invalidan las queries de partidos (`matchesByRound`,
   `matchesMeta`) y de fechas.

### Qué fecha buscar

- Si la última fecha del torneo en la base tiene partidos sin terminar, o le faltan partidos,
  es esa (completar). Si no, la siguiente (`max(round_number) + 1`).
- **Playoffs**: la etapa sale del sufijo del `season.slug` (`quarterfinals` → `cuartos`). El
  nombre de la fecha sale de la etapa ("Cuartos de Final").
- **Fase regular**: ESPN no da número de fecha, así que se deduce: desde el día siguiente al
  último partido cargado, se recorren hasta 10 días juntando partidos de equipos del torneo
  que todavía no jueguen en la fecha buscada. Un partido reprogramado de una fecha vieja puede
  colarse: va como aviso, no se carga solo.

### Vista previa: cuatro grupos

| Grupo | Qué es | Qué hace al confirmar |
| --- | --- | --- |
| **Nuevos** | En ESPN con horario, no en la base | Se insertan |
| **Horario cambiado** | Ya existe y ESPN trae otra hora | Se actualiza **solo si el pronóstico no cerró** con la hora vieja ni con la nueva. Si cerró, aviso y no se toca. Los pronósticos se conservan |
| **Sin horario / postergados** | `STATUS_POSTPONED` o sin hora confirmada | No se cargan. Si ya estaban en la base, no se borran |
| **Sin cambios** | Igual que en la base | Nada (se muestran plegados) |

Cada fila muestra local, visitante, día y hora en hora argentina, número de partido y sus
avisos. "Confirmar carga" se habilita si hay algo para guardar.

### Equipos que no matchean

Si un equipo de ESPN no está mapeado, la fila muestra un selector con los equipos de `teams`
(`Common/SelectDropdown`). Lo elegido se guarda como alias **en la misma confirmación**, así la
semana siguiente matchea solo. Mientras una fila tenga un equipo sin resolver, ese partido no se
puede confirmar, pero el resto sí.

### Playoffs: el cuadro

- **Ronda con ronda anterior cargada** (cuartos, semis, final): el partido `i` junta a los
  ganadores de los partidos `2i-1` y `2i` de la anterior (por goles, o `qualifier_team_id` si
  hubo empate). La vista previa numera cada partido de ESPN por el par que lo alimenta. Si un
  partido no corresponde a ningún par, aviso en rojo: la llave se dibujaría sin conectores.
- **Primera ronda de playoffs** (no hay ronda anterior): ESPN no dice la posición en el cuadro.
  Se propone el número por horario, **con un aviso fuerte**, y el número se puede editar en la
  vista previa para ponerlo según el cuadro oficial. Pasa una vez por torneo.

### Qué torneo consulta qué liga

En `src/config/tournaments.config.ts`, por slug: la liga de ESPN (`arg.1`) y cómo reconocer
la temporada en `season.slug` (`clausura`). Un torneo sin esa entrada no muestra el botón. Así
no se toca el esquema por esto.

## Base de datos

**No hay migraciones en el repo**: el SQL de cada cambio, con su rollback, va a un documento
del plan (ver S6 de `pendientes.md`). Después de aplicarlo se corre `pnpm types:db`.

### Identidad de un partido: `matches.external_id`

Columna nueva `text`, nullable, con el `event.id` de ESPN. Hace que "ya existe" y "le cambió el
horario" no dependan de los equipos ni del orden local/visitante. Un partido sin `external_id`
(todos los cargados a mano, incluidos los cuartos del 27/11) se reconoce por par de equipos
dentro de la fecha, y la RPC le completa el `external_id`.

### Alias de equipos: `team_external_ids`

`(source text, external_id text, team_id uuid → teams, external_name text)`, clave
`(source, external_id)`. Se mapea por el **id de ESPN**, que es estable. El nombre queda para
mostrarlo. RLS: lectura para admins y escritura solo por la RPC.

### RPC: `admin_sync_round`

`security definer`, `search_path` fijo y `is_admin()` primero, como `admin_set_world_cup_lock`.

Recibe torneo, número y nombre de la fecha, la lista de partidos a insertar o actualizar y los
alias nuevos. Todo en una transacción:

- rechaza si el torneo no está `active` (es la regla de `isReadOnly`, del lado de la base);
- crea la fecha si no existe, con `status = 'pending'` explícito (el default viola el CHECK);
- guarda los alias;
- inserta los nuevos, o actualiza el `match_date` de un existente **solo si faltan más de 10
  minutos para la hora vieja y para la nueva**. Si no, lo saltea y lo informa;
- **nunca borra** y nunca toca resultados ni `is_finished`;
- devuelve un resumen (insertados, actualizados, salteados y por qué).

El chequeo del cierre se repite en SQL porque la UI no es una garantía. Eso duplica
`PREDICTION_CUTOFF_MINUTES`: se anota al lado de la constante, y se resuelve junto con el
cierre en la base (S2 de `pendientes.md`).

## Código

- **Funciones puras** (`src/utils/espnImport/` o similar): parsear el scoreboard, deducir la
  fecha, mapear equipos, validar el cuadro y armar la comparación. Tests con fixtures recortados
  de respuestas reales de ESPN.
- **Consulta a ESPN**: aislada en un solo archivo, para poder mudarla a un servidor si ESPN
  cierra CORS.
- **Hook** con TanStack Query: la vista previa es una query que se dispara a mano y la
  confirmación una mutación (`retry: 0`, contrato `{ data, error }`, keys de `queryKeys.ts`).
- **Componente** autocontenido: botón, vista previa y confirmación. Respeta `isReadOnly`.
- **CSP**: sumar `https://site.api.espn.com` a `connect-src` en `vercel.json`.

## Cómo se prueba

En `test-sandbox` primero: una fecha regular completa, una a medias, un horario cambiado antes y
después del cierre, un equipo sin mapear y una ronda de playoffs contra su cuadro. Recién
después, en un torneo real.

## Lo que queda para el plan

- La UI de la vista previa (es compacta o tabla grande según dónde termine el botón).
- Los nombres exactos de archivos, la key de query y el formato del resumen de la RPC.
- La ventana de 10 días de la fase regular y la heurística de "hora sin confirmar" se ajustan
  con datos reales.
