# ⚽ Prode Chiqui Tapia

Aplicación web para jugar al prode entre amigos. Soporta varios torneos en paralelo, cada uno con su propio tema visual y sus reglas.

## 🚀 Stack

- **React 19** + **Vite 7** (SWC)
- **Supabase** — base de datos, auth y lógica de puntajes
- **Vitest** + Testing Library
- Deploy en **Vercel**

Sin router, sin librería de estado y sin framework de CSS. UI y commits en español.

## 📦 Instalación

Requiere **Node 22.x** y **pnpm**.

```bash
git clone https://github.com/colomarina/prode-futbol.git
cd prode-futbol

pnpm install

# Copiar las variables de entorno y completarlas
cp .env.example .env

pnpm dev
```

## 🔧 Comandos

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Build de producción a `dist/` |
| `pnpm preview` | Sirve el build |
| `pnpm test` | Tests (una corrida) |
| `pnpm test:watch` | Tests en watch |
| `pnpm test:coverage` | Tests con reporte de cobertura |
| `pnpm lint` / `pnpm lint:fix` | ESLint sobre `src` |
| `pnpm format` / `pnpm format:check` | Prettier sobre `src` |

Prettier corre **como regla de ESLint**, así que `pnpm lint` también falla por problemas de formato.

## 🔑 Variables de entorno

Van en `.env` (no versionado). Ver `.env.example` para la lista completa.

Ojo con el nombre: la key es `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY`, **no** `VITE_SUPABASE_ANON_KEY`.

## 🎯 Funcionalidades

- Autenticación y perfil de usuario
- Carga de pronósticos por fecha, con cierre automático 10 minutos antes de cada partido
- Tabla de posiciones general y por fecha
- Vista de todas las predicciones (por partido o por usuario)
- Estadísticas personales: rachas, récords, evolución de posición
- Playoffs con bracket y predicción de clasificado
- Bonus del Mundial (preguntas especiales)
- Panel de administración: partidos, resultados, horarios y fechas
- Multi-torneo con tema visual propio, y **modo consulta** de solo lectura para torneos finalizados

## 📊 Sistema de puntos

El scoring **no se calcula en el cliente**: lo resuelve Supabase y la app solo lee los resultados.

Los puntos y los criterios de desempate que ve el usuario están en `src/components/InfoPage/info.config.jsx`, que es la fuente de verdad para el texto de la sección "Info" de la app.

## 🔐 Roles

- **Admin** — carga resultados, gestiona partidos, horarios y fechas
- **User** — carga pronósticos y consulta tablas y estadísticas

El rol vive en `profiles.role`. El chequeo en el cliente solo **oculta UI**: la autorización real depende de las policies de RLS en Supabase.

## 📚 Documentación

- `CLAUDE.md` — guía de arquitectura del proyecto
- `docs/supabase-schema.md` — snapshot del esquema de la base

## 👥 Autor

lucasmarina26@gmail.com
