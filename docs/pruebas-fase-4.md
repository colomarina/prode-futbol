# Pruebas — Fase 4 (React Router)

Checklist para validar la rama `refactor/fase-4-router`.
Descartable una vez mergeada.

**Requiere las fases 3a y 3b**: esta rama sale de la 3b.

## Qué cambió

La app pasa de dos URLs (`/` y `/profile`) a una ruta por pantalla. `Navigation`
deja de decidir qué renderizar —eso lo hace el router— y queda solo como shell.

Rutas nuevas:

| URL | Pantalla |
|---|---|
| `/pronosticos` | Mis pronósticos |
| `/mundialistas` | Predicciones mundialistas |
| `/rivales` | Ver pronósticos (acepta `?fecha=N&jugador=ID`) |
| `/posiciones` | Tabla de posiciones |
| `/playoffs` | Playoffs |
| `/reglas/puntos`, `/reglas/desempates`, `/reglas/estado-partidos` | Reglas |
| `/estadisticas` | Estadísticas personales |
| `/perfil` | Mi perfil |
| `/admin/partidos`, `/admin/fechas`, `/admin/horarios`, `/admin/mundial` | Administración |

⚠️ **`/profile` dejó de existir** — ahora es `/perfil`.

---

## Resultado

**Todo verificado.**

Se probó manejando la app con Playwright sobre `test-sandbox`, `apertura-2026`
(finalizado), `mundial-2026` y con la cuenta no admin `test-colo`.

| Sección | Resultado |
|---|---|
| 1. Navegación básica | ✅ 12/12 URLs y 12/12 tabs activos |
| 2. Lo que antes no se podía | ✅ |
| 3. Redirecciones | ✅ |
| 4. Guards | ✅ |
| 5. Perfil y recuperación | ✅ |
| 6. Cambio de torneo y logout | ✅ |

**Navegación (1).** Las 12 pantallas del menú y de los tabs dan la URL esperada, y
el tab que queda marcado como activo coincide siempre. Las flechas del teclado
mueven el tab **y** cambian la URL (`/pronosticos` → `/rivales`).

**Historial (2).** F5 en 8 rutas distintas deja en la misma pantalla, con el tab
correcto y sin pantallas en blanco. El botón atrás recorre exactamente
`/estadisticas → /playoffs → /posiciones → /pronosticos`, y adelante vuelve. Una
URL copiada abre la misma pantalla en otra pestaña. El deep link de la tabla
genera `/rivales?fecha=1&jugador=<uuid>` y, **abierto en frío en otra pestaña**,
reconstruye la vista por usuario con el jugador y la fecha ya seleccionados.

**Redirecciones (3).** `/` → `/pronosticos` en un torneo activo y → `/posiciones`
en uno finalizado. `/cualquier-cosa` → inicio, `/reglas` → `/reglas/puntos`,
`/admin` → `/admin/partidos`. Ninguna en blanco.

**Guards (4).** Con `test-colo` y un torneo elegido, las 4 rutas `/admin/*` y
`/mundialistas` redirigen a `/pronosticos`: ninguna en blanco y ninguna filtra
contenido de administración. El menú tampoco ofrece Administración. Siendo admin
en `apertura-2026` (finalizado), las 4 rutas `/admin/*` redirigen a `/posiciones`.
En un torneo `league` los tabs mundialistas no existen; en `mundial-2026`
`/mundialistas` sí carga.

**Perfil (5).** `/perfil` carga con `active_tournament_slug` en `null`, sin rebotar
al selector. Con `#type=recovery` la pantalla entra en modo recuperación, con su
aviso y el bloque "Definir nueva contraseña". Definir la clave nueva **cierra la
sesión y vuelve a `/` pidiendo login**, y después se entra con la clave nueva.

Ese último paso obligó a cambiar de verdad la contraseña de `test-colo`: Supabase
rechaza reusar la misma con "New password should be different from the old
password". La clave nueva **no se anota acá a propósito** —este archivo se
commitea— sino en la memoria local del proyecto.

**Logout (6).** Sin torneo, `/` muestra el selector; al elegir uno activo lleva a
`/pronosticos`; "Cambiar torneo" vuelve a `/`. Cerrar sesión estando en
`/estadisticas` lleva a `/` con el login, sin dejar la URL colgada.

## Lo que quedó sin verificar

**El link del mail de recuperación, de punta a punta.** Abrir un mail real no se
puede automatizar. Lo que sí se verificó: que `Login` arma el `redirectTo` con
`PROFILE_PATH`, y que la pantalla a la que ese link lleva (`/perfil` con
`#type=recovery`) funciona completa. Del lado de Supabase se agregó `/perfil` a
**Authentication → URL Configuration → Redirect URLs**, conservando `/profile`
mientras la versión vieja siga en producción.

**El rewrite de Vercel en la preview.** `vercel.json` tiene
`{"source": "/(.*)", "destination": "/index.html"}`, o sea que cualquier ruta
profunda cae en el SPA. Con esa config el riesgo es mínimo; confirmarlo en la
preview es de todos modos gratis.

## Observaciones

**Se agregó una ruta puente `/profile` → `/perfil`.** Sin ella, el path viejo caía
en el catch-all y terminaba en la pantalla de inicio: quien abriera un mail de
recuperación **ya enviado** quedaba con la sesión de recuperación abierta pero sin
el formulario para definir la clave, que vive solo en `/perfil`. La ruta conserva
`search` y `hash`, que es donde viene el `access_token`. Verificado:

| Se pide | Llega a | Hash | Modo recuperación |
|---|---|---|---|
| `/profile` | `/perfil` | — | no |
| `/profile#type=recovery` | `/perfil` | `#type=recovery` | **sí** |
| `/profile?algo=1#type=recovery` | `/perfil?algo=1` | `#type=recovery` | **sí** |

`LEGACY_PROFILE_PATH` vive al lado de `PROFILE_PATH` en la config, con dos tests que
lo cuidan: que no se igualen (redirigiría a sí misma y el navegador entraría en
loop) y que no le pise el path a ninguna pantalla real. Se puede borrar cuando no
queden mails viejos circulando.

**Sin torneo elegido, una URL profunda no redirige: queda en la barra.**
`App.jsx` muestra el selector antes de que el router evalúe las rutas, así que
`/admin/fechas` sin torneo deja esa URL visible con el selector en pantalla. Al
elegir un torneo se va a su pantalla inicial, así que nadie queda trabado; es
cosmético.

**El error de Supabase al cambiar la contraseña sale en inglés.** `UserProfile`
muestra `passwordError.message` crudo; `toSpanishAuthError` existe en `Login` pero
no se usa acá. Preexistente y ajeno a esta fase.

**Warning de `@tippyjs/react`** en React 19 (`children.ref`), preexistente e
idéntico en `main`. Es el único error de consola en todas las corridas.

---

## Checklist

### 1. Navegación básica

- [ ] El menú hamburguesa lleva a cada sección y la URL cambia
- [ ] Los tabs de cada vista cambian la URL
- [ ] El tab correcto queda marcado como activo en cada pantalla
- [ ] Las flechas ← → del teclado siguen moviendo entre tabs

### 2. Lo que antes no se podía — la razón de esta fase

- [ ] **F5 en cualquier pantalla** te deja en esa misma pantalla, no en el inicio
- [ ] **El botón atrás** del navegador recorre el historial de verdad
- [ ] **Copiar la URL** de la tabla de posiciones, abrirla en otra pestaña y caer ahí
- [ ] Desde la tabla, "ver pronósticos" de un jugador lleva a `/rivales?fecha=N&jugador=ID`
      con la fecha y el jugador **ya seleccionados**. Ese link también se puede compartir

### 3. Redirecciones

- [ ] `/` lleva a `/pronosticos` en un torneo activo
- [ ] `/` lleva a `/posiciones` en un torneo **finalizado**
- [ ] Una URL inventada (`/cualquier-cosa`) redirige al inicio, no rompe
- [ ] `/reglas` sin sección redirige a `/reglas/puntos`
- [ ] `/admin` sin sección redirige a `/admin/partidos`

### 4. Guards — **riesgo alto**

Antes, cuando no correspondía mostrar algo, se renderizaba `null` (pantalla en
blanco). Ahora redirige.

- [ ] Con una cuenta **no admin**, entrar a mano a `/admin/fechas` → redirige al inicio
- [ ] En un torneo **finalizado**, ni siquiera el admin entra a `/admin/*`
- [ ] En un torneo que **no es el Mundial**, `/mundialistas` redirige al inicio
- [ ] En un torneo que **no es el Mundial**, los tabs de mundialistas no aparecen

### 5. Perfil y recuperación de contraseña — **riesgo alto**

Acá había un bug real: el mail de recuperación apuntaba a `/profile`, que ya no
existe.

- [ ] `/perfil` carga **sin** tener un torneo seleccionado
- [ ] Pedir "olvidé mi contraseña" y abrir el link del mail: tiene que llevar a
      `/perfil` y dejar cambiar la clave
- [ ] Al terminar el cambio de contraseña, vuelve al inicio y pide login

### 6. Cambio de torneo y logout

- [ ] "Cambiar torneo" en el menú vuelve al selector
- [ ] Elegir otro torneo lleva a su pantalla inicial
- [ ] Cerrar sesión vuelve a `/` y muestra el login
- [ ] Estando en `/estadisticas`, cerrar sesión **no** deja esa URL colgada

---

## Señales de alarma

- Una URL que muestra la pantalla equivocada
- Un tab marcado como activo que no coincide con lo que se ve
- El botón atrás que no hace nada o salta de más
- Pantalla en blanco en `/admin/*` en vez de redirigir
- El link del mail de recuperación que da 404 o pantalla en blanco

---

## Qué no cubre

- **El rewrite de Vercel.** `vercel.json` ya manda todo a `index.html`, así que
  las rutas profundas deberían funcionar en el deploy, pero recién se confirma
  en la preview: probá entrar directo a `/posiciones` desde la URL.
- **RLS**: los guards de admin siguen siendo solo de UI.
