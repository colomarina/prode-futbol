import { memo } from 'react'
import { resolveTeamName } from '../../../utils/teams'
import { formatMatchDateShort, formatMatchTime } from '../../../utils/matchDate'
import type { BracketSlot, SlotSource } from '../../../utils/bracket'
import type { PlayoffPrediction } from '../../../hooks/usePlayoffs'
import type { MatchWithTeams, Team, Uuid } from '../../../types/domain'
import styles from './BracketMatchCard.module.css'

type TeamResult = 'winner' | 'loser' | undefined

export type CardLayout = 'stacked' | 'versus'

const isTieScore = (match: Pick<MatchWithTeams, 'home_score' | 'away_score'>) =>
  match.home_score !== null && match.home_score === match.away_score

const getResult = (teamId: Uuid, winnerTeamId: Uuid | null): TeamResult => {
  if (!winnerTeamId) return undefined
  return teamId === winnerTeamId ? 'winner' : 'loser'
}

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

function VersusLogo({ team }: { team: Pick<Team, 'name' | 'logo_url'> | null | undefined }) {
  return team?.logo_url ? (
    <img className={styles.versusLogo} src={team.logo_url} alt="" loading="lazy" />
  ) : (
    <span className={styles.versusLogo} aria-hidden="true">
      ⚽
    </span>
  )
}

function VersusTeam({
  team,
  result,
}: {
  team: Pick<Team, 'name' | 'logo_url'> | null | undefined
  result: TeamResult
}) {
  return (
    <div className={styles.versusTeam} data-result={result}>
      <VersusLogo team={team} />
      <span className={styles.versusName}>{team?.name || 'A confirmar'}</span>
      {result === 'winner' && <span className={styles.srOnly}>clasificado</span>}
    </div>
  )
}

function SourceSide({ source }: { source: SlotSource }) {
  if (source.teams.length === 0) return <VersusTeam team={null} result={undefined} />

  return (
    <div className={styles.versusTeam}>
      <span className={styles.logos}>
        {source.teams.map(team => (
          <VersusLogo key={team.id} team={team} />
        ))}
      </span>
      <span className={styles.versusName}>{source.teams.map(team => team.name).join(' o ')}</span>
    </div>
  )
}

function VersusCenter({ text }: { text: string }) {
  return (
    <span className={styles.versusCenter} data-testid="versus-center">
      {text}
    </span>
  )
}

const getVersusScore = (match: MatchWithTeams, isFinished: boolean) =>
  isFinished && match.home_score !== null && match.away_score !== null
    ? `${match.home_score} - ${match.away_score}`
    : 'vs'

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

function PredictionLine({
  match,
  prediction,
  isFinished,
}: {
  match: MatchWithTeams
  prediction: PlayoffPrediction
  isFinished: boolean
}) {
  const hitQualifier = prediction.qualifier_prediction_id === match.qualifier_team_id
  const showsQualifierResult = isFinished && Boolean(match.qualifier_team_id)

  return (
    <div className={styles.prediction}>
      <span>
        Tu pronóstico: {prediction.home_prediction}-{prediction.away_prediction}
      </span>
      {isFinished && <span className={styles.points}>+{prediction.points ?? 0} pts</span>}
      {prediction.qualifier_prediction_id && (
        <span className={styles.pick}>
          Elegiste: {resolveTeamName(prediction.qualifier_prediction_id, match)}
          {showsQualifierResult ? (hitQualifier ? ' ✅' : ' ❌') : ''}
        </span>
      )}
    </div>
  )
}

const BracketMatchCard = memo(function BracketMatchCard({
  slot,
  prediction = null,
  layout = 'stacked',
}: {
  slot: BracketSlot
  prediction?: PlayoffPrediction | null
  layout?: CardLayout
}) {
  const { match } = slot

  if (!match) {
    const [homeSource, awaySource] = slot.sources ?? [{ teams: [] }, { teams: [] }]
    return (
      <article className={styles.card} data-placeholder="true" data-layout={layout}>
        {layout === 'versus' ? (
          <div className={styles.versus}>
            <SourceSide source={homeSource} />
            <VersusCenter text="vs" />
            <SourceSide source={awaySource} />
          </div>
        ) : (
          <>
            <SourceRow source={homeSource} />
            <SourceRow source={awaySource} />
          </>
        )}
      </article>
    )
  }

  const isFinished = slot.state === 'finished'
  const wonOnPenalties = isFinished && isTieScore(match) && Boolean(match.qualifier_team_id)

  const homeResult = getResult(match.home_team_id, slot.winnerTeamId)
  const awayResult = getResult(match.away_team_id, slot.winnerTeamId)
  const predictionLine = prediction && (
    <PredictionLine match={match} prediction={prediction} isFinished={isFinished} />
  )
  const penaltiesNote = wonOnPenalties && <p className={styles.meta}>Clasificó por penales</p>

  if (layout === 'versus') {
    return (
      <article className={styles.card} data-state={slot.state} data-layout="versus">
        <Footer slot={{ ...slot, match }} />
        <div className={styles.versus}>
          <VersusTeam team={match.home_team} result={homeResult} />
          <VersusCenter text={getVersusScore(match, isFinished)} />
          <VersusTeam team={match.away_team} result={awayResult} />
        </div>
        {penaltiesNote}
        {predictionLine}
      </article>
    )
  }

  return (
    <article className={styles.card} data-state={slot.state} data-layout="stacked">
      <TeamRow
        team={match.home_team}
        score={isFinished ? match.home_score : null}
        result={homeResult}
      />
      <TeamRow
        team={match.away_team}
        score={isFinished ? match.away_score : null}
        result={awayResult}
      />
      {penaltiesNote}
      <Footer slot={{ ...slot, match }} />
      {predictionLine}
    </article>
  )
})

export default BracketMatchCard
