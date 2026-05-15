/**
 * Tournament Configuration
 * Defines visual theme (colors, emoji, labels) for each tournament
 * Keys must match tournament.slug in Supabase
 */

export const TOURNAMENT_CONFIG = {
  'apertura-2026': {
    label: 'Apertura 2026',
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
        '--color-text-secondary': '#757575',
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
    emoji: '🌍',
    cssVars: {
      light: {
        '--color-primary': '#75AADB',
        '--color-primary-dark': '#4A8BC4',
        '--color-primary-light': '#9EC3E8',
        '--color-secondary': '#75AADB',
        '--color-secondary-light': '#9EC3E8',
        '--color-background': '#F0F7FF',
        '--color-surface': '#FFFFFF',
        '--color-surface-variant': '#f5f9ff',
        '--color-surface-highlight': '#dde9f5',
        '--color-admin-badge': '#fee2e2',
        '--color-text-primary': '#212121',
        '--color-text-secondary': '#757575',
        '--color-text-disabled': '#bdbdbd',
        '--color-text-on-primary': '#ffffff',
        '--color-success': '#2e7d32',
        '--color-success-light': '#4caf50',
        '--color-error': '#c62828',
        '--color-error-light': '#e53935',
        '--color-warning': '#f9a825',
        '--color-warning-light': '#fbc02d',
        '--color-info': '#75AADB',
        '--color-info-light': '#9EC3E8',
        '--color-border': '#c9d5e8',
        '--color-border-light': '#dde9f5',
        '--color-divider': '#c9d5e8',
        '--color-match-card': '#FFFFFF',
        '--color-match-highlight2': '#e8f1ff',
        '--color-match-highlight': '#d4e5ff',
        '--color-match-highlight3': '#c0d8ff',
        '--color-score-home': '#75AADB',
        '--color-score-away': '#37474f',
        '--color-badge': '#C9A84C',
        '--color-badge-light': '#E2C97E',
      },
      dark: {
        '--color-primary': '#75AADB',
        '--color-primary-dark': '#4A8BC4',
        '--color-primary-light': '#9EC3E8',
        '--color-secondary': '#75AADB',
        '--color-secondary-light': '#9EC3E8',
        '--color-background': '#0A0F1A',
        '--color-surface': '#121929',
        '--color-surface-variant': '#1a2235',
        '--color-surface-highlight': '#1f2f47',
        '--color-admin-badge': '#3d2626',
        '--color-text-primary': '#e8f1ff',
        '--color-text-secondary': '#9cacc3',
        '--color-text-disabled': '#6a7a8f',
        '--color-text-on-primary': '#ffffff',
        '--color-success': '#2e7d32',
        '--color-success-light': '#4caf50',
        '--color-error': '#c62828',
        '--color-error-light': '#e53935',
        '--color-warning': '#f9a825',
        '--color-warning-light': '#fbc02d',
        '--color-info': '#75AADB',
        '--color-info-light': '#9EC3E8',
        '--color-border': '#2f4458',
        '--color-border-light': '#3f5568',
        '--color-divider': '#2f4458',
        '--color-match-card': '#121929',
        '--color-match-highlight2': '#1f2f47',
        '--color-match-highlight': '#2a3f5c',
        '--color-match-highlight3': '#354f74',
        '--color-score-home': '#75AADB',
        '--color-score-away': '#9cacc3',
        '--color-badge': '#C9A84C',
        '--color-badge-light': '#E2C97E',
      },
    },
  },
}

/**
 * Apply tournament theme to document root
 * @param {string} slug - Tournament slug (must exist in TOURNAMENT_CONFIG)
 * @param {boolean} isDark - Whether to apply dark theme colors
 */
export const applyTournamentTheme = (slug, isDark) => {
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

/**
 * Get tournament config by slug
 * @param {string} slug - Tournament slug
 * @returns {Object|null} Tournament config or null if not found
 */
export const getTournamentConfig = slug => {
  return TOURNAMENT_CONFIG[slug] || null
}

/**
 * Get all tournament slugs
 * @returns {Array<string>} Array of tournament slugs
 */
export const getTournamentSlugs = () => {
  return Object.keys(TOURNAMENT_CONFIG)
}
