import { useRef } from 'react'
import type { KeyboardEvent } from 'react'
import { STAGE_SHORT_LABELS } from '../../../utils/bracket'
import type { BracketRound } from '../../../utils/bracket'
import type { PlayoffStage } from '../../../types/domain'
import { getStageTabId } from './stageTabId'
import styles from './StageTabs.module.css'

export default function StageTabs({
  rounds,
  selected,
  onSelect,
  panelId,
}: {
  rounds: BracketRound[]
  selected: PlayoffStage
  onSelect: (stage: PlayoffStage) => void
  panelId: string
}) {
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([])

  const select = (index: number) => {
    onSelect(rounds[index].stage)
    tabsRef.current[index]?.focus()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const current = rounds.findIndex(round => round.stage === selected)
    const targets: Record<string, number> = {
      ArrowRight: (current + 1) % rounds.length,
      ArrowLeft: (current - 1 + rounds.length) % rounds.length,
      Home: 0,
      End: rounds.length - 1,
    }
    if (!(event.key in targets)) return

    event.preventDefault()
    select(targets[event.key])
  }

  return (
    <div role="tablist" aria-label="Rondas de playoffs" className={styles.tabs}>
      {rounds.map((round, index) => {
        const isSelected = round.stage === selected
        return (
          <button
            key={round.stage}
            ref={el => {
              tabsRef.current[index] = el
            }}
            type="button"
            role="tab"
            id={getStageTabId(panelId, round.stage)}
            aria-selected={isSelected}
            aria-controls={panelId}
            tabIndex={isSelected ? 0 : -1}
            className={styles.tab}
            onClick={() => onSelect(round.stage)}
            onKeyDown={handleKeyDown}
          >
            {STAGE_SHORT_LABELS[round.stage]}
          </button>
        )
      })}
    </div>
  )
}
