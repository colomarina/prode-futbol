import { memo } from 'react'
import { resolveTeamName } from '../../../utils/teams'
import { formatMatchDateShort, formatMatchTime } from '../../../utils/matchDate'
import type { BracketSlot, SlotSource } from '../../../utils/bracket'
import type { PlayoffPrediction } from '../../../hooks/usePlayoffs'
import type { MatchWithTeams, Team, Uuid } from '../../../types/domain'
import styles from './BracketMatchCard.module.css'

type TeamResult = 'winner' | 'loser' | undefined

/**
 * Empate con el marcador cargado. Sin el chequeo de `null`, un partido marcado
 * terminado sin goles daba `null === null` y mostraba "Clasificó por penales".
 */
const isTieScore = (match: Pick<MatchWithTeams, 'home_score' | 'away_score'>) =>
  match.home_score !== null && match.home_score === match.away_score

const getResult = (teamId: Uuid, winnerTeamId: Uuid | null): TeamResult => {
  if (!winnerTeamId) return undefined
  return teamId === winnerTeamId ? 'winner' : 'loser'
}

/**
 * Una fila por equipo. El escudo va con `alt=""` porque el nombre está escrito al
 * lado; el ganador se marca con un texto oculto además del estilo, así no depende
 * solo del color.
 */
function TeamRow({
  team,
  score,
  result,
}: {
  team: Pick<Team, 'name' | 'logo_url'> | null | undefined
  score: number | null
  result: TeamResult
}) {
  return (
    <div className={styles.row} data-result={result}>
      {team?.logo_url ? (
        <img className={styles.logo} src={team.logo_url} alt="" loading="lazy" />
      ) : (
        <span className={styles.logo} aria-hidden="true">
          ⚽
        </span>
      )}
      <span className={styles.name}>{team?.name || 'A confirmar'}</span>
      {result === 'winner' && <span className={styles.srOnly}>clasificado</span>}
      {score !== null && <span className={styles.score}>{score}</span>}
    </div>
  )
}

/**
 * Un lado de un cruce sin cargar: el ganador ya definido, los dos posibles
 * ("River Plate o Lanús", con los dos escudos) o "A confirmar" si tampoco se
 * conoce el partido de origen.
 */
function SourceRow({ source }: { source: SlotSource }) {
  if (source.teams.length === 0) return <TeamRow team={null} score={null} result={undefined} />

  return (
    <div className={styles.row}>
      <span className={styles.logos}>
        {source.teams.map(team =>
          team.logo_url ? (
            <img key={team.id} className={styles.logo} src={team.logo_url} alt="" loading="lazy" />
          ) : (
            <span key={team.id} className={styles.logo} aria-hidden="true">
              ⚽
            </span>
          )
        )}
      </span>
      <span className={styles.name}>{source.teams.map(team => team.name).join(' o ')}</span>
    </div>
  )
}

function Footer({ slot }: { slot: BracketSlot & { match: MatchWithTeams } }) {
  if (slot.state === 'live') return <p className={styles.live}>En juego</p>
  if (slot.state === 'awaiting-result') return <p className={styles.meta}>Resultado pendiente</p>
  if (slot.state === 'finished') return <p className={styles.meta}>Final</p>

  return (
    <p className={styles.meta}>
      {formatMatchDateShort(slot.match.match_date)} · {formatMatchTime(slot.match.match_date)}
    </p>
  )
}

/**
 * Lo que el usuario pronosticó. Antes de que empiece el partido no se muestra nada
 * si no pronosticó: puede estar a tiempo, y un "no pronosticaste" sería falso.
 * Los puntos aparecen recién con el partido terminado.
 */
function PredictionLine({
  match,
  prediction,
  isFinished,
}: {
  match: MatchWithTeams
  prediction: PlayoffPrediction
  isFinished: boolean
}) {
  const isTie = isFinished && isTieScore(match)
  const hitQualifier = prediction.qualifier_prediction_id === match.qualifier_team_id

  return (
    <div className={styles.prediction}>
      <span>
        Tu pronóstico: {prediction.home_prediction}-{prediction.away_prediction}
      </span>
      {isFinished && <span className={styles.points}>+{prediction.points ?? 0} pts</span>}
      {prediction.qualifier_prediction_id && (
        <span className={styles.pick}>
          Elegiste: {resolveTeamName(prediction.qualifier_prediction_id, match)}
          {isTie && match.qualifier_team_id ? (hitQualifier ? ' ✅' : ' ❌') : ''}
        </span>
      )}
    </div>
  )
}

const BracketMatchCard = memo(function BracketMatchCard({
  slot,
  prediction = null,
}: {
  slot: BracketSlot
  prediction?: PlayoffPrediction | null
}) {
  const { match } = slot

  if (!match) {
    const sources = slot.sources ?? [{ teams: [] }, { teams: [] }]
    return (
      <article className={styles.card} data-placeholder="true">
        {sources.map((source, index) => (
          <SourceRow key={index} source={source} />
        ))}
      </article>
    )
  }

  const isFinished = slot.state === 'finished'
  const wonOnPenalties = isFinished && isTieScore(match) && Boolean(match.qualifier_team_id)

  return (
    <article className={styles.card} data-state={slot.state}>
      <TeamRow
        team={match.home_team}
        score={isFinished ? match.home_score : null}
        result={getResult(match.home_team_id, slot.winnerTeamId)}
      />
      <TeamRow
        team={match.away_team}
        score={isFinished ? match.away_score : null}
        result={getResult(match.away_team_id, slot.winnerTeamId)}
      />
      {wonOnPenalties && <p className={styles.meta}>Clasificó por penales</p>}
      <Footer slot={{ ...slot, match }} />
      {prediction && (
        <PredictionLine match={match} prediction={prediction} isFinished={isFinished} />
      )}
    </article>
  )
})

export default BracketMatchCard
