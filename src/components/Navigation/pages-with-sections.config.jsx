/**
 * Vistas y sus secciones internas.
 *
 * Cada sección declara su `path`, así que este archivo es la fuente única tanto
 * de los tabs como del mapa de rutas: agregar una pantalla es agregar una
 * entrada acá y su `<Route>` en `src/routes.jsx`.
 */

export const TOURNAMENT_SECTIONS = [
  {
    id: 'predictions',
    path: '/pronosticos',
    label: 'Mis Pronósticos',
    mobileLabel: 'Pronósticos',
    icon: '📊',
  },
  {
    id: 'world-cup-predictions',
    path: '/mundialistas',
    label: 'Predicciones Mundialistas',
    mobileLabel: 'Mundialistas',
    icon: '🌍',
  },
  {
    id: 'all-predictions',
    path: '/rivales',
    label: 'Ver Pronósticos',
    mobileLabel: 'Rivales',
    icon: '👀',
  },
  {
    id: 'leaderboard',
    path: '/posiciones',
    label: 'Tabla de Posiciones',
    mobileLabel: 'Tabla',
    icon: '🏆',
  },
  { id: 'playoffs', path: '/playoffs', label: 'Playoffs', mobileLabel: 'Playoffs', icon: '🥊' },
]

export const INFO_SECTIONS = [
  { id: 'points', path: '/reglas/puntos', label: 'Sistema de Puntos', icon: '🎯' },
  { id: 'tiebreaks', path: '/reglas/desempates', label: 'Desempates', icon: '⚖️' },
  { id: 'match-status', path: '/reglas/estado-partidos', label: 'Estado de Partidos', icon: '📋' },
]

export const STATS_SECTIONS = [
  { id: 'personal', path: '/estadisticas', label: 'Estadísticas Personales', icon: '📈' },
]

export const ADMIN_SECTIONS = [
  {
    id: 'admin-matches',
    path: '/admin/partidos',
    label: 'Gestionar Partidos',
    mobileLabel: 'Partidos',
    icon: '⚽',
  },
  {
    id: 'admin-rounds',
    path: '/admin/fechas',
    label: 'Gestionar Fechas',
    mobileLabel: 'Fechas',
    icon: '📅',
  },
  {
    id: 'admin-match-schedule',
    path: '/admin/horarios',
    label: 'Horarios de Partidos',
    mobileLabel: 'Horarios',
    icon: '🕒',
  },
  {
    id: 'admin-world-cup',
    path: '/admin/mundial',
    label: 'Predicciones Mundialistas',
    mobileLabel: 'Mundialistas',
    icon: '🌍',
  },
]

/** Vista sin secciones: no muestra tabs, pero sí tiene ruta propia. */
export const PROFILE_PATH = '/perfil'

export const PAGES_WITH_SECTIONS = {
  tournament: {
    sections: TOURNAMENT_SECTIONS,
    defaultSection: 'predictions',
  },
  info: {
    sections: INFO_SECTIONS,
    defaultSection: 'points',
  },
  stats: {
    sections: STATS_SECTIONS,
    defaultSection: 'personal',
  },
  admin: {
    sections: ADMIN_SECTIONS,
    defaultSection: 'admin-matches',
  },
}

const ALL_SECTIONS = Object.values(PAGES_WITH_SECTIONS).flatMap(page => page.sections)

export function hasViewSections(viewId) {
  return viewId in PAGES_WITH_SECTIONS
}

export function getViewSections(viewId) {
  return PAGES_WITH_SECTIONS[viewId]?.sections || null
}

export function getDefaultSection(viewId) {
  return PAGES_WITH_SECTIONS[viewId]?.defaultSection || null
}

/**
 * Path de una sección. Es lo que usa `Navigation` para navegar cuando se toca
 * un tab.
 */
export function getSectionPath(sectionId) {
  return ALL_SECTIONS.find(section => section.id === sectionId)?.path || null
}

/** Path por defecto de una vista, para las redirecciones. */
export function getViewDefaultPath(viewId) {
  if (viewId === 'profile') return PROFILE_PATH
  return getSectionPath(getDefaultSection(viewId))
}

/**
 * Qué vista y qué sección corresponden a una URL.
 * @returns {{viewId: string, sectionId: string|null}}
 */
export function resolveRoute(pathname) {
  if (pathname.startsWith(PROFILE_PATH)) {
    return { viewId: 'profile', sectionId: null }
  }

  for (const [viewId, page] of Object.entries(PAGES_WITH_SECTIONS)) {
    const section = page.sections.find(item => pathname.startsWith(item.path))
    if (section) return { viewId, sectionId: section.id }
  }

  return { viewId: 'tournament', sectionId: null }
}
