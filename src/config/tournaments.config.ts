/**
 * Tournament Configuration
 * Defines visual theme (colors, emoji, labels) for each tournament
 * Keys must match tournament.slug in Supabase
 */

/** Las custom properties que se inyectan en `document.documentElement`. */
export type CssVars = Record<string, string>

/** El tema de un torneo: cómo se llama, con qué emoji y sus dos paletas. */
export interface TournamentConfig {
  label: string
  prodeName: string
  emoji: string
  cssVars: {
    light: CssVars
    dark: CssVars
  }
}

/**
 * Las claves son los `slug` de la tabla `tournaments`. Un slug nuevo en la base sin
 * entrada acá se renderiza con la paleta base de `src/index.css`.
 */
export const TOURNAMENT_CONFIG: Record<string, TournamentConfig> = {
  'apertura-2026': {
    label: 'Apertura 2026',
    prodeName: 'Prode Chiqui Tapia',
    emoji: '🏆',
    cssVars: {
      light: {
        '--color-primary': '#1e7f43',
        '--color-primary-dark': '#155a2f',
        '--color-primary-light': '#2a9e56',
        '--color-secondary': '#4caf50',
        '--color-secondary-light': '#66bb6a',
        '--color-background': '#f5f5f5',
        '--color-surface': '#ffffff',
        '--color-surface-variant': '#fafafa',
        '--color-surface-highlight': '#e8f5e9',
        '--color-admin-badge': '#fee2e2',
        '--color-text-primary': '#212121',
        '--color-text-secondary': '#666666',
        '--color-text-disabled': '#bdbdbd',
        '--color-text-on-primary': '#ffffff',
        '--color-success': '#2e7d32',
        '--color-success-light': '#4caf50',
        '--color-error': '#c62828',
        '--color-error-light': '#e53935',
        '--color-warning': '#f9a825',
        '--color-warning-light': '#fbc02d',
        '--color-info': '#1976d2',
        '--color-info-light': '#42a5f5',
        '--color-border': '#e0e0e0',
        '--color-border-light': '#eeeeee',
        '--color-divider': '#e0e0e0',
        '--color-match-card': '#ffffff',
        '--color-match-highlight2': '#f1f8f4',
        '--color-match-highlight': '#d4edda',
        '--color-match-highlight3': '#c8e6c9',
        '--color-score-home': '#1e7f43',
        '--color-score-away': '#37474f',
        '--color-badge': '#ff6f00',
        '--color-badge-light': '#ffa726',
      },
      dark: {
        '--color-primary': '#1e7f43',
        '--color-primary-dark': '#155a2f',
        '--color-primary-light': '#2a9e56',
        '--color-secondary': '#4caf50',
        '--color-secondary-light': '#66bb6a',
        '--color-background': '#0f0f0f',
        '--color-surface': '#1a1a1a',
        '--color-surface-variant': '#242424',
        '--color-surface-highlight': '#1b3a1f',
        '--color-admin-badge': '#3d2626',
        '--color-text-primary': '#e8e8e8',
        '--color-text-secondary': '#a0a0a0',
        '--color-text-disabled': '#606060',
        '--color-text-on-primary': '#ffffff',
        '--color-success': '#2e7d32',
        '--color-success-light': '#4caf50',
        '--color-error': '#c62828',
        '--color-error-light': '#e53935',
        '--color-warning': '#f9a825',
        '--color-warning-light': '#fbc02d',
        '--color-info': '#1976d2',
        '--color-info-light': '#42a5f5',
        '--color-border': '#333333',
        '--color-border-light': '#262626',
        '--color-divider': '#333333',
        '--color-match-card': '#1a1a1a',
        '--color-match-highlight2': '#0d2410',
        '--color-match-highlight': '#0f3a1a',
        '--color-match-highlight3': '#134d1a',
        '--color-score-home': '#1e7f43',
        '--color-score-away': '#8a9aaa',
        '--color-badge': '#ff6f00',
        '--color-badge-light': '#ffa726',
      },
    },
  },
  'mundial-2026': {
    label: 'Mundial 2026',
    prodeName: 'Prode GianniInfantino S.A',
    emoji: '🌍',
    cssVars: {
      light: {
        '--color-primary': '#6CB4EE',
        '--color-primary-dark': '#3F8FD2',
        '--color-primary-light': '#A9D6F5',

        '--color-secondary': '#D4AF37',
        '--color-secondary-light': '#E6C766',

        '--color-background': '#F8FBFF',
        '--color-surface': '#FFFFFF',
        '--color-surface-variant': '#F1F8FF',
        '--color-surface-highlight': '#E0F0FF',

        '--color-admin-badge': '#FFF3D6',

        '--color-text-primary': '#111111',
        '--color-text-secondary': '#555555',
        '--color-text-disabled': '#9E9E9E',
        '--color-text-on-primary': '#FFFFFF',

        '--color-success': '#2E7D32',
        '--color-success-light': '#4CAF50',

        '--color-error': '#C62828',
        '--color-error-light': '#E53935',

        '--color-warning': '#D4AF37',
        '--color-warning-light': '#E6C766',

        '--color-info': '#6CB4EE',
        '--color-info-light': '#A9D6F5',

        '--color-border': '#D5E8F7',
        '--color-border-light': '#EAF4FC',
        '--color-divider': '#D5E8F7',

        '--color-match-card': '#FFFFFF',
        '--color-match-highlight2': '#EAF4FF',
        '--color-match-highlight': '#D8ECFF',
        '--color-match-highlight3': '#C4E3FF',

        '--color-score-home': '#6CB4EE',
        '--color-score-away': '#111111',

        '--color-badge': '#D4AF37',
        '--color-badge-light': '#E6C766',
        '--color-group-a-bg': '#DBEEFF',
        '--color-group-a-text': '#1D5FA8',
        '--color-group-b-bg': '#FFF1D6',
        '--color-group-b-text': '#A55B00',
        '--color-group-c-bg': '#E6F7E9',
        '--color-group-c-text': '#1F7A3D',
        '--color-group-d-bg': '#FDE7F3',
        '--color-group-d-text': '#A63D7A',
        '--color-group-e-bg': '#FFEAE5',
        '--color-group-e-text': '#AD4A2B',
        '--color-group-f-bg': '#E8F5F8',
        '--color-group-f-text': '#1F6D86',
        '--color-group-g-bg': '#F4F0FF',
        '--color-group-g-text': '#5C45A5',
        '--color-group-h-bg': '#FFF6D9',
        '--color-group-h-text': '#8A6A00',
        '--color-group-i-bg': '#EAF7F2',
        '--color-group-i-text': '#1E7F63',
        '--color-group-j-bg': '#FCEFE3',
        '--color-group-j-text': '#9C5C1F',
        '--color-group-k-bg': '#E8EFFD',
        '--color-group-k-text': '#2F5FAF',
        '--color-group-l-bg': '#F3EAFE',
        '--color-group-l-text': '#6E3FA8',
      },

      dark: {
        '--color-primary': '#6CB4EE',
        '--color-primary-dark': '#3F8FD2',
        '--color-primary-light': '#A9D6F5',

        '--color-secondary': '#D4AF37',
        '--color-secondary-light': '#E6C766',

        '--color-background': '#0B0B0B',
        '--color-surface': '#171717',
        '--color-surface-variant': '#202020',
        '--color-surface-highlight': '#2A2A2A',

        '--color-admin-badge': '#4D3D10',

        '--color-text-primary': '#F5F5F5',
        '--color-text-secondary': '#B0B0B0',
        '--color-text-disabled': '#707070',
        '--color-text-on-primary': '#FFFFFF',

        '--color-success': '#2E7D32',
        '--color-success-light': '#4CAF50',

        '--color-error': '#C62828',
        '--color-error-light': '#E53935',

        '--color-warning': '#D4AF37',
        '--color-warning-light': '#E6C766',

        '--color-info': '#6CB4EE',
        '--color-info-light': '#A9D6F5',

        '--color-border': '#2F2F2F',
        '--color-border-light': '#3A3A3A',
        '--color-divider': '#2F2F2F',

        '--color-match-card': '#171717',
        '--color-match-highlight2': '#1F2A35',
        '--color-match-highlight': '#27384A',
        '--color-match-highlight3': '#30465D',

        '--color-score-home': '#6CB4EE',
        '--color-score-away': '#F5F5F5',

        '--color-badge': '#D4AF37',
        '--color-badge-light': '#E6C766',
        '--color-group-a-bg': '#1D334A',
        '--color-group-a-text': '#A9D6F5',
        '--color-group-b-bg': '#3A2B12',
        '--color-group-b-text': '#F2C879',
        '--color-group-c-bg': '#173726',
        '--color-group-c-text': '#8FD8A7',
        '--color-group-d-bg': '#3A1F31',
        '--color-group-d-text': '#F2A9D1',
        '--color-group-e-bg': '#3A241D',
        '--color-group-e-text': '#F0B299',
        '--color-group-f-bg': '#15353D',
        '--color-group-f-text': '#8ED5E3',
        '--color-group-g-bg': '#271F3F',
        '--color-group-g-text': '#C2B2F5',
        '--color-group-h-bg': '#3D320F',
        '--color-group-h-text': '#EED785',
        '--color-group-i-bg': '#13372F',
        '--color-group-i-text': '#93DFC6',
        '--color-group-j-bg': '#3B2817',
        '--color-group-j-text': '#EFC39A',
        '--color-group-k-bg': '#1B2D4A',
        '--color-group-k-text': '#AFC7F2',
        '--color-group-l-bg': '#2E1E45',
        '--color-group-l-text': '#CDB1F3',
      },
    },
  },
  'clausura-2026': {
    label: 'Clausura 2026',
    prodeName: 'Prode Chiqui Tapia',
    emoji: '🏆',
    cssVars: {
      light: {
        '--color-primary': '#1e7f43',
        '--color-primary-dark': '#155a2f',
        '--color-primary-light': '#2a9e56',
        '--color-secondary': '#4caf50',
        '--color-secondary-light': '#66bb6a',
        '--color-background': '#f5f5f5',
        '--color-surface': '#ffffff',
        '--color-surface-variant': '#fafafa',
        '--color-surface-highlight': '#e8f5e9',
        '--color-admin-badge': '#fee2e2',
        '--color-text-primary': '#212121',
        '--color-text-secondary': '#666666',
        '--color-text-disabled': '#bdbdbd',
        '--color-text-on-primary': '#ffffff',
        '--color-success': '#2e7d32',
        '--color-success-light': '#4caf50',
        '--color-error': '#c62828',
        '--color-error-light': '#e53935',
        '--color-warning': '#f9a825',
        '--color-warning-light': '#fbc02d',
        '--color-info': '#1976d2',
        '--color-info-light': '#42a5f5',
        '--color-border': '#e0e0e0',
        '--color-border-light': '#eeeeee',
        '--color-divider': '#e0e0e0',
        '--color-match-card': '#ffffff',
        '--color-match-highlight2': '#f1f8f4',
        '--color-match-highlight': '#d4edda',
        '--color-match-highlight3': '#c8e6c9',
        '--color-score-home': '#1e7f43',
        '--color-score-away': '#37474f',
        '--color-badge': '#ff6f00',
        '--color-badge-light': '#ffa726',
      },
      dark: {
        '--color-primary': '#1e7f43',
        '--color-primary-dark': '#155a2f',
        '--color-primary-light': '#2a9e56',
        '--color-secondary': '#4caf50',
        '--color-secondary-light': '#66bb6a',
        '--color-background': '#0f0f0f',
        '--color-surface': '#1a1a1a',
        '--color-surface-variant': '#242424',
        '--color-surface-highlight': '#1b3a1f',
        '--color-admin-badge': '#3d2626',
        '--color-text-primary': '#e8e8e8',
        '--color-text-secondary': '#a0a0a0',
        '--color-text-disabled': '#606060',
        '--color-text-on-primary': '#ffffff',
        '--color-success': '#2e7d32',
        '--color-success-light': '#4caf50',
        '--color-error': '#c62828',
        '--color-error-light': '#e53935',
        '--color-warning': '#f9a825',
        '--color-warning-light': '#fbc02d',
        '--color-info': '#1976d2',
        '--color-info-light': '#42a5f5',
        '--color-border': '#333333',
        '--color-border-light': '#262626',
        '--color-divider': '#333333',
        '--color-match-card': '#1a1a1a',
        '--color-match-highlight2': '#0d2410',
        '--color-match-highlight': '#0f3a1a',
        '--color-match-highlight3': '#134d1a',
        '--color-score-home': '#1e7f43',
        '--color-score-away': '#8a9aaa',
        '--color-badge': '#ff6f00',
        '--color-badge-light': '#ffa726',
      },
    },
  },
}

/** Inyecta la paleta del torneo en el root del documento. */
export const applyTournamentTheme = (slug: string | null | undefined, isDark: boolean): void => {
  if (!slug || !TOURNAMENT_CONFIG[slug]) {
    // console.warn(`Tournament theme not found for slug: ${slug}`)
    return
  }

  const themeMode = isDark ? 'dark' : 'light'
  const cssVars = TOURNAMENT_CONFIG[slug].cssVars[themeMode]

  Object.entries(cssVars).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value)
  })

  document.documentElement.setAttribute('data-tournament', slug)
}

export const getTournamentConfig = (slug: string | null | undefined): TournamentConfig | null => {
  return (slug && TOURNAMENT_CONFIG[slug]) || null
}

export const getTournamentSlugs = (): string[] => {
  return Object.keys(TOURNAMENT_CONFIG)
}
