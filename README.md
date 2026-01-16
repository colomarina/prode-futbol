# ⚽ Prode Fútbol

Aplicación web para jugar prode con amigos.

## 🚀 Tecnologías

- React + Vite
- Supabase (Backend & Auth)

## 📦 Instalación
```bash
# Clonar repositorio
git clone https://github.com/colomarina/prode-futbol.git
cd prode-futbol

# Instalar dependencias
npm install

# Configurar variables de entorno
# Crear archivo .env con:
# VITE_SUPABASE_URL=tu-url
# VITE_SUPABASE_ANON_KEY=tu-key

# Correr en desarrollo
npm run dev
```

## 🎯 Funcionalidades

- ✅ Autenticación de usuarios
- ✅ Carga de pronósticos
- ✅ Administración de partidos (admin)
- ✅ Validación de tiempo límite (1 hora antes)
- ✅ Sistema de puntos automático
- 🚧 Tabla de posiciones (en desarrollo)

## 🔐 Roles

- **Admin**: Puede crear partidos y cargar resultados
- **User**: Puede cargar pronósticos y ver tabla

## 📊 Sistema de Puntos

- Resultado exacto: 5 puntos
- Diferencia de goles exacta: 3 puntos
- Ganador correcto: 1 punto

## 📝 To-Do

- [ ] Tabla de posiciones
- [ ] Vista de todas las predicciones
- [ ] Notificaciones
- [ ] Estadísticas por usuario
- [ ] Historial de fechas anteriores

## 🚀 Deploy

Deployado en Vercel: [URL cuando lo subas]

## 👥 Autor

[lucasmarina26@gmail.com]
