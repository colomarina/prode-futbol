import { getWinnerTeamId } from './score'
import { getResultLoadTime } from './matchTiming'
import type { MatchesByStage } from '../hooks/usePlayoffs'
import type { Match, MatchWithTeams, PlayoffStage, TeamSummary, Uuid } from '../types/domain'

/**
 * El modelo del cuadro de playoffs, separado de cómo se dibuja.
 *
 * La regla que lo sostiene: en un playoff `match_number` es la posición en el
 * cuadro. El partido `i` de una ronda (base 1) se alimenta de los partidos `2i-1`
 * y `2i` de la anterior. No todos los torneos se cargaron así —en el Apertura 2026
 * los octavos se numeraron por horario—, y por eso `connected` comprueba que los
 * cruces cierren antes de que alguien dibuje líneas entre ellos.
 */

const STAGES: PlayoffStage[] = ['32avos', '16avos', 'octavos', 'cuartos', 'semifinal', 'final']

export const STAGE_LABELS: Record<PlayoffStage, string> = {
  '32avos': '32avos de final',
  '16avos': '16avos de final',
  octavos: 'Octavos de final',
  cuartos: 'Cuartos de final',
  semifinal: 'Semifinales',
  final: 'Final',
}

/** Para las tabs del celular, donde los nombres completos no entran todos. */
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
  /** `null` es un cruce que todavía no se conoce: "A confirmar". */
  match: MatchWithTeams | null
  /** `null` si no hay partido. */
  state: SlotState | null
  winnerTeamId: Uuid | null
  /**
   * Para un cruce sin cargar en un cuadro que cierra: de dónde sale cada lado.
   * `null` si el cruce está cargado o si los cruces no cierran (no se inventa).
   */
  sources: [SlotSource, SlotSource] | null
}

/**
 * Un lado de un cruce sin cargar: el ganador si su partido de origen terminó (un
 * equipo), los dos que lo juegan si no (dos), o nada si el origen tampoco se
 * conoce todavía.
 */
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
  /** El partido por el tercer puesto, fuera del cuadro. `null` si no hay. */
  thirdPlace: BracketSlot | null
  /** Si los cruces cierran y se pueden dibujar los conectores. */
  connected: boolean
}

/**
 * Quién pasa de ronda. En un empate lo define `qualifier_team_id` (penales); si
 * todavía no está cargado, no hay ganador, aunque el partido figure terminado.
 */
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

/**
 * Un partido empezado se muestra "en juego" hasta que vence el plazo para cargar
 * el resultado (`getResultLoadTime`, la misma regla que habilita al admin); de ahí
 * en más, "resultado pendiente": sin eso diría "en juego" para siempre si nadie
 * lo carga.
 */
const getSlotState = (match: MatchWithTeams, now: Date): SlotState => {
  if (match.is_finished) return 'finished'
  if (now < new Date(match.match_date)) return 'scheduled'
  return now < getResultLoadTime(match.match_date) ? 'live' : 'awaiting-result'
}

/**
 * Ubica cada partido en el slot `match_number - 1`. Uno sin número o fuera de
 * rango cae en el primer slot libre: mejor un cuadro con un cruce corrido que un
 * partido que desaparece.
 */
const placeMatches = (matches: MatchWithTeams[], size: number): (MatchWithTeams | null)[] => {
  const slots: (MatchWithTeams | null)[] = Array.from({ length: size }, () => null)
  const unplaced: MatchWithTeams[] = []

  matches.forEach(match => {
    const index = (match.match_number ?? 0) - 1
    if (index >= 0 && index < size && slots[index] === null) slots[index] = match
    else unplaced.push(match)
  })

  unplaced.forEach(match => {
    const free = slots.indexOf(null)
    if (free >= 0) slots[free] = match
  })

  return slots
}

const teamsOf = (match: MatchWithTeams | null): Uuid[] =>
  match ? [match.home_team_id, match.away_team_id] : []

/**
 * Si un equipo puede venir de un cruce de origen: si ese partido terminó, tiene
 * que ser su ganador; si no, cualquiera de los dos que lo juegan.
 */
const comesFrom = (team: Uuid, feeder: BracketSlot): boolean =>
  feeder.winnerTeamId ? team === feeder.winnerTeamId : teamsOf(feeder.match).includes(team)

/**
 * Un cruce cargado tiene que tener un equipo de cada uno de sus dos cruces de
 * origen. Una ronda sin cargar no se compara: sus slots no tienen equipos.
 */
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

/** Completa `sources` en los cruces sin cargar, mirando sus dos partidos de origen. */
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

/**
 * El tercer puesto no tiene etapa propia en el CHECK de `playoff_stage`: el
 * Mundial 2026 lo cargó como un segundo partido de `final`. Es el que juegan los
 * dos que perdieron su semi; si las semis no están definidas todavía, el que se
 * juega primero (siempre va antes que la final).
 */
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
    const size = Math.max(matches.length, Math.ceil(previousSize / 2), 1)

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

/**
 * La ronda que se juega ahora: la primera con un cruce sin conocer o sin terminar.
 * Con todo terminado, la última (la final).
 */
export function getCurrentStage(bracket: Bracket): PlayoffStage | null {
  const current = bracket.rounds.find(round => round.slots.some(slot => slot.state !== 'finished'))
  return (current ?? bracket.rounds.at(-1))?.stage ?? null
}

/**
 * El próximo momento en que cambia el estado de algún cruce: el arranque de un
 * partido programado o el vencimiento de uno en juego. La llave pone un solo
 * timer para ese momento en vez de recalcular cada X minutos sin que nada cambie.
 */
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
