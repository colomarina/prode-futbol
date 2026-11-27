import { formatMatchDateShort, formatMatchTime } from '../../utils/matchDate'

export const toDatetimeLocalValue = (value: string | null | undefined): string => {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const pad = (number: number) => String(number).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export const toUtcIso = (value: string | null | undefined): string | null => {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return date.toISOString()
}

const toMinute = (value: string): number => Math.floor(new Date(value).getTime() / 60000)

export const hasScheduleChanged = (
  originalIso: string | null,
  edited: string | null | undefined
): boolean => {
  if (!originalIso || !edited) return false
  if (Number.isNaN(new Date(edited).getTime())) return false
  return toMinute(edited) !== toMinute(originalIso)
}

export const getPreviousTime = (originalIso: string | null, edited: string): string | null => {
  if (!hasScheduleChanged(originalIso, edited)) return null
  const sameDay = formatMatchDateShort(originalIso) === formatMatchDateShort(edited)
  return sameDay
    ? formatMatchTime(originalIso)
    : `${formatMatchDateShort(originalIso)} ${formatMatchTime(originalIso)}`
}
