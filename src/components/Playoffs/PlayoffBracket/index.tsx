import { memo, useEffect, useId, useMemo, useState } from 'react'
import BracketMatchCard from '../BracketMatchCard'
import type { CardLayout } from '../BracketMatchCard'
import Button from '../../Common/Button'
import StageTabs from '../StageTabs'
import { getStageTabId } from '../StageTabs/stageTabId'
import { buildBracket, getCurrentStage, getNextChange } from '../../../utils/bracket'
import type { BracketSlot } from '../../../utils/bracket'
import type { MatchesByStage, PlayoffPrediction } from '../../../hooks/usePlayoffs'
import type { PlayoffStage } from '../../../types/domain'
import styles from './PlayoffBracket.module.css'

const MAX_TIMER_DELAY_MS = 24 * 60 * 60 * 1000

type MobileView = 'rounds' | 'bracket'

const byDate = (a: BracketSlot, b: BracketSlot) => {
  if (!a.match) return b.match ? 1 : 0
  if (!b.match) return -1
  return new Date(a.match.match_date).getTime() - new Date(b.match.match_date).getTime()
}

const PlayoffBracket = memo(function PlayoffBracket({
  matchesByStage,
  predictionsByMatch,
}: {
  matchesByStage: MatchesByStage
  /** Pronósticos del usuario indexados por id de partido. */
  predictionsByMatch: Record<string, PlayoffPrediction>
}) {
  const [now, setNow] = useState(() => new Date())
  const bracket = useMemo(() => buildBracket(matchesByStage, now), [matchesByStage, now])
  const currentStage = getCurrentStage(bracket)
  const [chosenStage, setChosenStage] = useState<PlayoffStage | null>(null)
  const panelId = useId()

  const nextChangeTime = getNextChange(bracket, now)?.getTime() ?? null
  useEffect(() => {
    if (nextChangeTime === null) return undefined
    const delay = Math.min(Math.max(nextChangeTime - Date.now(), 0), MAX_TIMER_DELAY_MS)
    const timer = setTimeout(() => setNow(new Date()), delay)
    return () => clearTimeout(timer)
  }, [nextChangeTime])

  const selectedStage =
    bracket.rounds.find(round => round.stage === chosenStage)?.stage ?? currentStage
  const selectedRound = bracket.rounds.find(round => round.stage === selectedStage)

  const [mobileView, setMobileView] = useState<MobileView>('rounds')

  const renderCard = (slot: BracketSlot, layout: CardLayout) => (
    <BracketMatchCard
      slot={slot}
      layout={layout}
      prediction={slot.match ? (predictionsByMatch[slot.match.id] ?? null) : null}
    />
  )

  const renderThirdPlace = (layout: CardLayout) =>
    bracket.thirdPlace && (
      <div className={styles.thirdPlace}>
        <h4 className={styles.thirdPlaceTitle}>Tercer puesto</h4>
        {renderCard(bracket.thirdPlace, layout)}
      </div>
    )

  return (
    <div className={styles.root} data-view={mobileView}>
      <div className={styles.viewToggle}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMobileView(view => (view === 'rounds' ? 'bracket' : 'rounds'))}
        >
          {mobileView === 'rounds' ? 'Ver cuadro completo' : 'Ver por ronda'}
        </Button>
      </div>

      <div className={styles.mobile}>
        {mobileView === 'rounds' && selectedStage && selectedRound && (
          <>
            <StageTabs
              rounds={bracket.rounds}
              selected={selectedStage}
              onSelect={setChosenStage}
              panelId={panelId}
            />
            <div
              role="tabpanel"
              tabIndex={0}
              id={panelId}
              aria-labelledby={getStageTabId(panelId, selectedStage)}
              className={styles.panel}
            >
              {[...selectedRound.slots].sort(byDate).map((slot, index) => (
                <div key={slot.match?.id ?? `vacio-${index}`}>{renderCard(slot, 'versus')}</div>
              ))}
              {selectedStage === 'final' && renderThirdPlace('versus')}
            </div>
          </>
        )}
      </div>

      <div className={styles.desktop}>
        <div className={styles.board} data-connected={String(bracket.connected)}>
          {bracket.rounds.map((round, roundIndex) => (
            <section
              key={round.stage}
              className={styles.column}
              data-first={roundIndex === 0 || undefined}
              data-last={roundIndex === bracket.rounds.length - 1 || undefined}
            >
              <h3 className={styles.title}>{round.label}</h3>
              {round.stage === 'final' && bracket.thirdPlace ? (
                <div className={styles.slots} style={{ gridTemplateRows: '1fr auto 1fr' }}>
                  <div aria-hidden="true" />
                  <div className={styles.slot}>
                    <div className={styles.cardWrap}>{renderCard(round.slots[0], 'stacked')}</div>
                  </div>
                  {renderThirdPlace('stacked')}
                </div>
              ) : (
                <div
                  className={styles.slots}
                  style={{ gridTemplateRows: `repeat(${round.slots.length}, 1fr)` }}
                >
                  {round.slots.map((slot, index) => (
                    <div key={slot.match?.id ?? `vacio-${index}`} className={styles.slot}>
                      <div className={styles.cardWrap}>{renderCard(slot, 'stacked')}</div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  )
})

export default PlayoffBracket
