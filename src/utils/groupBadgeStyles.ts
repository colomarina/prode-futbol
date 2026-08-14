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

const normalizeGroupLabel = (groupLabel: unknown): string => {
  if (typeof groupLabel !== 'string') return ''
  return groupLabel.trim().toUpperCase()
}

/** Los dos colores del badge de grupo, o null si no corresponde mostrarlo. */
type GroupBadgeColors = { backgroundColor: string; color: string }

export const getGroupBadgeColors = (
  groupLabel: string | null | undefined,
  tournamentSlug: string | null | undefined
): GroupBadgeColors | null => {
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
