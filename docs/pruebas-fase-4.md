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
