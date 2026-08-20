# Pruebas — Fase 9 (Supabase: RLS, triggers y esquema)

Registro de la verificación empírica de la base. **No hay cambios de código todavía**:
esto es diagnóstico. Los arreglos van en migraciones, que necesitan credenciales que
el cliente no tiene (`service_role` o el panel).

Método: con la cuenta de prueba `test-colo` (no admin, `user_id`
`91ef25b3-…`) se sacó un JWT `authenticated` por la API de auth y se probaron
lecturas, escrituras y RPCs con la misma `anon key` que usa la app. O sea, se probó
**exactamente lo que puede hacer cualquier usuario logueado**.

---

## 🔴 Hallazgo crítico: escalada de privilegios

**Un usuario común puede hacerse admin editando su propio perfil.**

```
PATCH /rest/v1/profiles?id=eq.<mi_id>   { "role": "admin" }
→ 200, y el role queda en "admin"
```

La policy de UPDATE de `profiles` deja cambiar **cualquier** columna de la fila
propia, incluida `role`. Y `role === 'admin'` es lo único que separa a un usuario del
panel de administración. O sea: cualquiera con una cuenta puede darse acceso de admin
con un `fetch`, y de ahí —si el resto de las policies confían en ese `role`— cargar
resultados, cerrar fechas y tocar el scoring.

Se verificó y **se revirtió inmediatamente**: el `role` de test-colo volvió a `user`.
Se comprobó también que el downgrade (`admin → user`) pasa igual, así que la policy es
abierta en las dos direcciones.

**El arreglo** es una policy de UPDATE en `profiles` que excluya `role` (y `id`) de las
columnas editables por el dueño, o un trigger `BEFORE UPDATE` que rechace cambiar
`role` salvo desde una función `SECURITY DEFINER`. El cliente solo edita `username` y
`full_name` (ver `AuthContext.updateProfile`), así que restringir a esas dos columnas
no rompe nada.

---

## RLS: el resto, tabla por tabla

Todo con la cuenta no-admin. "Rechaza" = la fila no cambió o vino un `42501`.

| Acción                                                    | Resultado              | ¿Correcto?                  |
| --------------------------------------------------------- | ---------------------- | --------------------------- |
| Leer `matches`, `rounds`, `profiles`, `predictions`       | permite                | sí (son de lectura pública) |
| **Escribir `matches`** (cambiar un resultado)             | **rechaza** (0 filas)  | ✅ RLS protege              |
| **Escribir `rounds`** (cambiar un status)                 | **rechaza** (0 filas)  | ✅ RLS protege              |
| Escribir un pronóstico **de otro usuario**                | **rechaza** (`42501`)  | ✅ RLS protege              |
| Editar `full_name`/`username` del perfil propio           | permite                | sí, es lo que hace la app   |
| Editar `role` del perfil propio                           | **permite**            | 🔴 ver arriba               |
| Escribir un pronóstico propio en un torneo **finalizado** | **permite**            | ⚠️ ver abajo                |
| Borrar un pronóstico propio (DELETE)                      | rechaza (204, 0 filas) | coherente: la app no borra  |

### `isReadOnly` es solo UI

Se cargó un pronóstico `7-7` en un partido del **Mundial** (status `finished`,
`isReadOnly = true` en el cliente) y **la base lo aceptó**. El "modo consulta" es un
guard de UI y nada más: la base no distingue un torneo cerrado de uno activo para las
escrituras de `predictions`.

No es tan grave como la escalada —el usuario solo puede tocar sus propios
pronósticos—, pero significa que alguien podría editar sus pronósticos de un torneo ya
jugado. El scoping por status tiene que existir en una policy o un trigger, no solo en
`TournamentContext`.

### El cierre de pronósticos tampoco existe en la base

Se escribió un pronóstico en un partido que se jugó hace 10 días (fecha 1 del
sandbox). La base lo aceptó sin chistar. `PREDICTION_CUTOFF_MINUTES` (10 min antes del
partido) es una convención de `utils/matchTiming.ts` y **la base no la aplica**. Ver
más abajo `can_predict`, que parece pensada justo para esto y no está cableada.

---

## Triggers: qué escribe los puntos

La pregunta que arrastraba el esquema desde el principio, ahora contestada con un
experimento: se escribió un pronóstico **exacto** (`2-1`) en un partido finalizado con
resultado `2-1`.

- El pronóstico entró con **`points: 0`**, no con los 4 que le corresponderían.
- **No apareció fila en `round_scores`** para esa fecha.

O sea: **no hay trigger sobre `predictions` que calcule puntos al escribir, ni cascada
a `round_scores`.** El cálculo tiene que ser un proceso que se dispara aparte —una RPC
que el admin corre al finalizar la fecha—. Los candidatos con nombre en el esquema son
`recalculate_round`, `recalculate_round_scores` y `reset_round` (no se ejecutaron:
escriben y no son idempotentes con la cuenta de prueba).

### La fórmula de puntos, documentada

`calculate_points(home_pred, away_pred, home_real, away_real)` es una función pura (no
toca tablas), así que se pudo probar sin riesgo. Resultado:

| Caso                            | Ejemplo                        | Puntos                    |
| ------------------------------- | ------------------------------ | ------------------------- |
| Pleno, +2 goles totales         | `3-1` vs `3-1`                 | **4** (cantidad de goles) |
| Pleno, +2 goles                 | `5-0` vs `5-0`                 | **5**                     |
| Pleno, ≤2 goles                 | `1-0` vs `1-0`, `0-0` vs `0-0` | **2**                     |
| Acertó ganador (no marcador)    | `1-0` vs `2-0`                 | **1**                     |
| Acertó ganador + total de goles | `2-1` vs `3-0`                 | **2** (1 + 1 de bonus)    |
| Solo el total de goles          | `3-1` vs `1-3`                 | **1**                     |
| Pifió                           | `2-0` vs `0-2`                 | **0**                     |

**Coincide exactamente con lo que el cliente asume** en `utils/stats/accuracy.ts`,
incluido el umbral de 3 goles del bonus (`GOALS_BONUS_MIN_TOTAL`) y que el bonus se
suma al acierto del ganador. El README, que describe un 5/3/1 viejo, sigue estando
mal; `accuracy.ts` está bien.

---

## RPCs sueltas que se probaron

- **`is_admin()`** → devuelve `false` para la cuenta de prueba. Funciona, así que las
  policies de admin **podrían** usarla; hay que leer las policies para confirmarlo. Su
  firma en el esquema generado dice `Args: { p_text: string }`, que es claramente
  incorrecta (se llama sin argumentos y anda): el generador la confundió con otra. No
  afecta al cliente porque no la llama.
- **`can_predict(match_id)`** → **está rota**: tira `42P01: relation "matches" does not
exist`. Es el síntoma de una función `SECURITY DEFINER` sin `search_path` seteado (no
  encuentra `public.matches`). Parece la pieza pensada para validar el cierre de
  pronósticos del lado de la base —lo que falta según el punto de arriba—, pero hoy no
  se puede ejecutar. Arreglarla y cablearla (o convertirla en trigger) cerraría el
  agujero del cutoff. El cliente no la llama, así que su rotura no se nota.

---

## Esquema: lo que confirmó el experimento

- FK `predictions.qualifier_prediction_id` → `teams`: **existe**
  (`predictions_qualifier_prediction_id_fkey`). Ya estaba tachado en el plan por el
  esquema generado; acá se reconfirma.
- `matches.status`: **columna muerta**. Nadie la lee; el estado del partido lo deriva
  `MatchStatusBadge` de `match_date` + `is_finished`.

El resto de la deuda de esquema (los `tournament_id` nullables, las 4 vistas, la
superficie muerta de pagos) está en `docs/refactor-pendiente.md` y no cambió con esta
corrida.

---

## Lo que queda para hacer (necesita migraciones)

En orden de urgencia:

1. **🔴 Policy de `profiles` que impida cambiar `role`.** Es la única vulnerabilidad
   real: escalada de privilegios con un `fetch`.
2. **Scoping por status en `predictions`**: rechazar escrituras en torneos que no
   estén `active`, para que `isReadOnly` no sea solo UI.
3. **Cierre de pronósticos en la base**: arreglar `can_predict` (`search_path`) y
   cablearla como trigger o CHECK, o rechazar el insert/update pasado el cutoff.
4. Bajar `is_admin` a las policies si todavía no está.
5. La deuda de esquema del plan: `tournament_id` nullables, `matches.status` muerta,
   índices, las 3 vistas de más, la superficie de pagos.

**Nada de esto se puede hacer desde el cliente.** Hace falta el CLI de Supabase con
`service_role`, o el panel. El repo no tiene SQL versionado; el proceso propuesto sigue
siendo adoptar `supabase/migrations/`.

## Datos de prueba que quedaron (para limpiar con service_role o panel)

El DELETE de `predictions` está bloqueado por RLS para el dueño, así que estas dos
filas de prueba de `test-colo` **no se pudieron borrar** desde el cliente:

- `id 10db5a14-…` — pronóstico `2-1` en `test-sandbox`, fecha 6, partido 4.
- `id 14977b31-…` — pronóstico `7-7` en `mundial-2026`, fecha 2, partido 7.

Las dos son inocuas (el Mundial está finalizado y el sandbox es de prueba), pero
conviene borrarlas al pasar. El `role` de `test-colo` quedó correctamente en `user`.
