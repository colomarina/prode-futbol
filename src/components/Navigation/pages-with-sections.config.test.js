import { describe, it, expect } from 'vitest'
import {
  PAGES_WITH_SECTIONS,
  PROFILE_PATH,
  TOURNAMENT_SECTIONS,
  ADMIN_SECTIONS,
  INFO_SECTIONS,
  getSectionPath,
  getViewDefaultPath,
  getDefaultSection,
  getViewSections,
  hasViewSections,
  resolveRoute,
} from './pages-with-sections.config'

const allSections = Object.values(PAGES_WITH_SECTIONS).flatMap(page => page.sections)

describe('config de secciones', () => {
  it('toda seccion tiene id, label y path absoluto', () => {
    allSections.forEach(section => {
      expect(section.id, `seccion sin id: ${JSON.stringify(section)}`).toBeTruthy()
      expect(section.label, `seccion sin label: ${section.id}`).toBeTruthy()
      expect(section.path, `seccion sin path: ${section.id}`).toMatch(/^\//)
    })
  })

  it('no hay ids ni paths repetidos', () => {
    const ids = allSections.map(section => section.id)
    const paths = allSections.map(section => section.path)

    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(paths).size).toBe(paths.length)
  })

  it('la seccion por defecto de cada vista existe entre sus secciones', () => {
    Object.entries(PAGES_WITH_SECTIONS).forEach(([viewId, page]) => {
      const defaultId = getDefaultSection(viewId)
      expect(page.sections.some(section => section.id === defaultId)).toBe(true)
    })
  })

  it('ninguna seccion pisa el path del perfil', () => {
    allSections.forEach(section => {
      expect(section.path.startsWith(PROFILE_PATH)).toBe(false)
    })
  })
})

describe('getSectionPath', () => {
  it('devuelve el path de una seccion', () => {
    expect(getSectionPath('leaderboard')).toBe('/posiciones')
    expect(getSectionPath('admin-fechas')).toBeNull()
  })

  it('encuentra secciones de cualquier vista', () => {
    expect(getSectionPath('admin-rounds')).toBe('/admin/fechas')
    expect(getSectionPath('tiebreaks')).toBe('/reglas/desempates')
  })
})

describe('getViewDefaultPath', () => {
  it('devuelve el path de la seccion por defecto', () => {
    expect(getViewDefaultPath('tournament')).toBe('/pronosticos')
    expect(getViewDefaultPath('admin')).toBe('/admin/partidos')
    expect(getViewDefaultPath('info')).toBe('/reglas/puntos')
  })

  it('el perfil no tiene secciones pero si path', () => {
    expect(getViewDefaultPath('profile')).toBe(PROFILE_PATH)
  })

  it('devuelve null para una vista inexistente', () => {
    expect(getViewDefaultPath('inventada')).toBeNull()
  })
})

describe('resolveRoute', () => {
  it('resuelve la vista y la seccion de cada path', () => {
    expect(resolveRoute('/posiciones')).toEqual({ viewId: 'tournament', sectionId: 'leaderboard' })
    expect(resolveRoute('/admin/fechas')).toEqual({ viewId: 'admin', sectionId: 'admin-rounds' })
    expect(resolveRoute('/reglas/desempates')).toEqual({ viewId: 'info', sectionId: 'tiebreaks' })
    expect(resolveRoute('/estadisticas')).toEqual({ viewId: 'stats', sectionId: 'personal' })
  })

  it('reconoce el perfil, que no tiene secciones', () => {
    expect(resolveRoute(PROFILE_PATH)).toEqual({ viewId: 'profile', sectionId: null })
  })

  it('resuelve ida y vuelta con getSectionPath', () => {
    // Si esto falla, un tab quedaria marcado como activo en la pantalla equivocada.
    allSections.forEach(section => {
      expect(resolveRoute(section.path).sectionId, `no resuelve ${section.path}`).toBe(section.id)
    })
  })

  it('cae en el torneo para una ruta desconocida', () => {
    expect(resolveRoute('/cualquier-cosa')).toEqual({ viewId: 'tournament', sectionId: null })
  })

  it('no confunde paths que comparten prefijo', () => {
    expect(resolveRoute('/pronosticos').sectionId).toBe('predictions')
    expect(resolveRoute('/posiciones').sectionId).toBe('leaderboard')
    expect(resolveRoute('/playoffs').sectionId).toBe('playoffs')
  })
})

describe('helpers de vistas', () => {
  it('hasViewSections distingue las vistas con tabs', () => {
    expect(hasViewSections('tournament')).toBe(true)
    expect(hasViewSections('admin')).toBe(true)
    expect(hasViewSections('profile')).toBe(false)
  })

  it('getViewSections devuelve las secciones o null', () => {
    expect(getViewSections('tournament')).toBe(TOURNAMENT_SECTIONS)
    expect(getViewSections('admin')).toBe(ADMIN_SECTIONS)
    expect(getViewSections('info')).toBe(INFO_SECTIONS)
    expect(getViewSections('profile')).toBeNull()
  })
})
