// Configuración del menú hamburguesa - Navegación global

/**
 * Una entrada del menú.
 *
 * Hay cuatro formas: las normales llevan a una vista (`viewType`), y las tres
 * especiales se distinguen por `type` y no tienen destino. `MainMenuView` ramifica
 * por ese campo.
 *
 * `change_tournament` **no está en este archivo**: lo arma `Sidebar` en runtime y
 * solo cuando el usuario tiene más de un torneo visible. Escribir la unión completa
 * acá es lo que lo deja documentado en un solo lugar.
 */
export interface MenuItem {
  id: string
  label: string
  icon?: string
  description?: string
  adminOnly: boolean
  viewType?: string
  type?: 'divider' | 'logout' | 'change_tournament'
}

export const MENU_ITEMS: MenuItem[] = [
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
