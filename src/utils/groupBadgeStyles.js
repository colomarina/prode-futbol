const MUNDIAL_TOURNAMENT_SLUG = 'mundial-2026'
const SUPPORTED_GROUP_LETTERS = new Set([
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
])

const normalizeGroupLabel = groupLabel => {
  if (typeof groupLabel !== 'string') return ''
  return groupLabel.trim().toUpperCase()
}

export const getGroupBadgeColors = (groupLabel, tournamentSlug) => {
  if (tournamentSlug !== MUNDIAL_TOURNAMENT_SLUG) return null

  const normalizedLabel = normalizeGroupLabel(groupLabel)
  if (!normalizedLabel) return null

  const groupLetterMatch = normalizedLabel.match(/\bGRUPO\s*([A-L])\b|^([A-L])$/i)
  const groupLetter = (groupLetterMatch?.[1] || groupLetterMatch?.[2] || '').toUpperCase()
  if (!SUPPORTED_GROUP_LETTERS.has(groupLetter)) return null

  const letter = groupLetter.toLowerCase()
  return {
    backgroundColor: `var(--color-group-${letter}-bg)`,
    color: `var(--color-group-${letter}-text)`,
  }
}
