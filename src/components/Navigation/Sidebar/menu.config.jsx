// Configuración del menú hamburguesa - Navegación global

export const MENU_ITEMS = [
  {
    id: 'tournament',
    label: 'Pronósticos',
    icon: '🏆',
    description: 'Pronósticos, rivales y tabla',
    adminOnly: false,
    viewType: 'tournament',
  },
  {
    id: 'info',
    label: 'Reglas',
    icon: 'ℹ️',
    description: 'Reglas, puntos y desempates',
    adminOnly: false,
    viewType: 'info',
  },
  {
    id: 'stats',
    label: 'Estadísticas',
    icon: '📈',
    description: 'Ver estadísticas personales y generales',
    adminOnly: false,
    viewType: 'stats',
  },
  {
    id: 'profile',
    label: 'Mi Perfil',
    icon: '👤',
    description: 'Editar nombre del equipo y contraseña',
    adminOnly: false,
    viewType: 'profile',
  },
  {
    id: 'admin-divider',
    type: 'divider',
    label: 'ADMINISTRACIÓN',
    adminOnly: true,
  },
  {
    id: 'admin',
    label: 'Administración',
    icon: '⚙️',
    description: 'Gestionar partidos y fechas',
    adminOnly: true,
    viewType: 'admin',
  },
  {
    id: 'logout',
    type: 'logout',
    label: 'Cerrar Sesión',
    description: 'Salir de tu cuenta',
    adminOnly: false,
  },
]
