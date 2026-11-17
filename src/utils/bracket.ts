import { getWinnerTeamId } from './score'
import { getResultLoadTime } from './matchTiming'
import type { MatchesByStage } from '../hooks/usePlayoffs'
import type { Match, MatchWithTeams, PlayoffStage, TeamSummary, Uuid } from '../types/domain'

const STAGES: PlayoffStage[] = ['32avos', '16avos', 'octavos', 'cuartos', 'semifinal', 'final']

export const STAGE_LABELS: Record<PlayoffStage, string> = {
  '32avos': '32avos de final',
  '16avos': '16avos de final',
  octavos: 'Octavos de final',
  cuartos: 'Cuartos de final',
  semifinal: 'Semifinales',
  final: 'Final',
}

export const STAGE_SHORT_LABELS: Record<PlayoffStage, string> = {
  '32avos': '32avos',
  '16avos': '16avos',
  octavos: 'Octavos',
  cuartos: 'Cuartos',
  semifinal: 'Semis',
  final: 'Final',
}

export type SlotState = 'scheduled' | 'live' | 'awaiting-result' | 'finished'

export interface BracketSlot {
  match: MatchWithTeams | null
  state: SlotState | null
  winnerTeamId: Uuid | null
  sources: [SlotSource, SlotSource] | null
}

export interface SlotSource {
  teams: TeamSummary[]
}

export interface BracketRound {
  stage: PlayoffStage
  label: string
  slots: BracketSlot[]
}

export interface Bracket {
  rounds: BracketRound[]
  thirdPlace: BracketSlot | null
  connected: boolean
}

export function getPlayoffWinnerId(
  match: Pick<
    Match,
    | 'is_finished'
    | 'home_score'
    | 'away_score'
    | 'home_team_id'
    | 'away_team_id'
    | 'qualifier_team_id'
  >
): Uuid | null {
  if (!match.is_finished) return null
  return getWinnerTeamId(match.home_score, match.away_score, match) ?? match.qualifier_team_id
}

const getSlotState = (match: MatchWithTeams, now: Date): SlotState => {
  if (match.is_finished) return 'finished'
  if (now < new Date(match.match_date)) return 'scheduled'
  return now < getResultLoadTime(match.match_date) ? 'live' : 'awaiting-result'
}

const fillFirstFreeSlots = (
  slots: (MatchWithTeams | null)[],
  unplaced: MatchWithTeams[]
): (MatchWithTeams | null)[] => {
  unplaced.forEach(match => {
    const free = slots.indexOf(null)
    if (free >= 0) slots[free] = match
  })
  return slots
}

const nextPowerOfTwo = (value: number) => 2 ** Math.ceil(Math.log2(value))

const highestMatchNumber = (matches: MatchWithTeams[]) =>
  Math.max(0, ...matches.map(match => match.match_number ?? 0))

const getRoundSize = (matches: MatchWithTeams[], previousSize: number): number => {
  if (previousSize > 0) return Math.max(matches.length, Math.ceil(previousSize / 2), 1)
  return nextPowerOfTwo(Math.max(matches.length, highestMatchNumber(matches), 1))
}

const placeMatches = (matches: MatchWithTeams[], size: number): (MatchWithTeams | null)[] => {
  const slots: (MatchWithTeams | null)[] = Array.from({ length: size }, () => null)
  const unplaced: MatchWithTeams[] = []

  matches.forEach(match => {
    const index = (match.match_number ?? 0) - 1
    if (index >= 0 && index < size && slots[index] === null) slots[index] = match
    else unplaced.push(match)
  })

  return fillFirstFreeSlots(slots, unplaced)
}

const teamsOf = (match: MatchWithTeams | null): Uuid[] =>
  match ? [match.home_team_id, match.away_team_id] : []

const comesFrom = (team: Uuid, feeder: BracketSlot): boolean =>
  feeder.winnerTeamId ? team === feeder.winnerTeamId : teamsOf(feeder.match).includes(team)

const roundsConnect = (previous: BracketRound, current: BracketRound): boolean => {
  if (previous.slots.length !== current.slots.length * 2) return false

  return current.slots.every((slot, index) => {
    if (!slot.match) return true

    const [first, second] = [previous.slots[index * 2], previous.slots[index * 2 + 1]]
    const { home_team_id: home, away_team_id: away } = slot.match
    return (
      (comesFrom(home, first) && comesFrom(away, second)) ||
      (comesFrom(home, second) && comesFrom(away, first))
    )
  })
}

const toSlot = (match: MatchWithTeams | null, now: Date): BracketSlot => ({
  match,
  state: match ? getSlotState(match, now) : null,
  winnerTeamId: match ? getPlayoffWinnerId(match) : null,
  sources: null,
})

const sourceOf = ({ match, winnerTeamId }: BracketSlot): SlotSource => {
  if (!match) return { teams: [] }

  const teams = [match.home_team, match.away_team].filter((team): team is TeamSummary =>
    Boolean(team)
  )
  const winner = teams.find(team => team.id === winnerTeamId)
  return { teams: winner ? [winner] : teams }
}

const withSources = (rounds: BracketRound[]): BracketRound[] =>
  rounds.map((round, index) =>
    index === 0
      ? round
      : {
          ...round,
          slots: round.slots.map((slot, slotIndex) =>
            slot.match
              ? slot
              : {
                  ...slot,
                  sources: [
                    sourceOf(rounds[index - 1].slots[slotIndex * 2]),
                    sourceOf(rounds[index - 1].slots[slotIndex * 2 + 1]),
                  ],
                }
          ),
        }
  )

const splitThirdPlace = (
  finals: MatchWithTeams[],
  semis: MatchWithTeams[]
): { finals: MatchWithTeams[]; thirdPlace: MatchWithTeams | null } => {
  if (finals.length < 2) return { finals, thirdPlace: null }

  const semiWinners = semis.map(getPlayoffWinnerId)
  const byTeams =
    semis.length > 0 && semiWinners.every(Boolean)
      ? finals.find(match => !teamsOf(match).some(team => semiWinners.includes(team)))
      : undefined
  const thirdPlace =
    byTeams ??
    [...finals].sort(
      (a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime()
    )[0]

  return { finals: finals.filter(match => match !== thirdPlace), thirdPlace }
}

export function buildBracket(matchesByStage: MatchesByStage, now: Date = new Date()): Bracket {
  const firstStage = STAGES.findIndex(stage => (matchesByStage[stage] ?? []).length > 0)
  if (firstStage < 0) return { rounds: [], thirdPlace: null, connected: false }

  const { finals, thirdPlace } = splitThirdPlace(
    matchesByStage.final ?? [],
    matchesByStage.semifinal ?? []
  )
  const rounds: BracketRound[] = []

  STAGES.slice(firstStage).forEach((stage, index) => {
    const matches = stage === 'final' ? finals : (matchesByStage[stage] ?? [])
    const previousSize = index === 0 ? 0 : rounds[index - 1].slots.length
    const size = getRoundSize(matches, previousSize)

    rounds.push({
      stage,
      label: STAGE_LABELS[stage],
      slots: placeMatches(matches, size).map(match => toSlot(match, now)),
    })
  })

  const connected = rounds.every(
    (round, index) => index === 0 || roundsConnect(rounds[index - 1], round)
  )

  return {
    rounds: connected ? withSources(rounds) : rounds,
    thirdPlace: thirdPlace ? toSlot(thirdPlace, now) : null,
    connected,
  }
}

export function getCurrentStage(bracket: Bracket): PlayoffStage | null {
  const current = bracket.rounds.find(round => round.slots.some(slot => slot.state !== 'finished'))
  return (current ?? bracket.rounds.at(-1))?.stage ?? null
}

export function getNextChange(bracket: Bracket, now: Date = new Date()): Date | null {
  const slots = [
    ...bracket.rounds.flatMap(round => round.slots),
    ...(bracket.thirdPlace ? [bracket.thirdPlace] : []),
  ]

  const times = slots.flatMap(({ match, state }) => {
    if (!match) return []
    if (state === 'scheduled') return [new Date(match.match_date)]
    if (state === 'live') return [getResultLoadTime(match.match_date)]
    return []
  })

  const upcoming = times.filter(time => time > now).sort((a, b) => a.getTime() - b.getTime())
  return upcoming[0] ?? null
}
