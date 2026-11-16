import { memo, useId, useMemo, useState } from 'react'
import BracketMatchCard from '../BracketMatchCard'
import StageTabs from '../StageTabs'
import { getStageTabId } from '../StageTabs/stageTabId'
import { buildBracket, getCurrentStage } from '../../../utils/bracket'
import type { BracketSlot } from '../../../utils/bracket'
import type { MatchesByStage, PlayoffPrediction } from '../../../hooks/usePlayoffs'
import type { PlayoffStage } from '../../../types/domain'
import styles from './PlayoffBracket.module.css'

/**
 * En el celular se lista por horario —lo que el usuario quiere saber es qué se
 * juega primero—, y los cruces sin conocer van al final. El cuadro de escritorio
 * respeta el orden del cuadro, que es el de los slots.
 */
const byDate = (a: BracketSlot, b: BracketSlot) => {
  if (!a.match) return b.match ? 1 : 0
  if (!b.match) return -1
  return new Date(a.match.match_date).getTime() - new Date(b.match.match_date).getTime()
}

/**
 * La llave: cuadro con conectores desde 1024px y una ronda por vez con tabs
 * debajo. Las dos vistas están en el DOM y el CSS muestra una; el modelo sale de
 * `buildBracket` y se calcula una sola vez.
 */
const PlayoffBracket = memo(function PlayoffBracket({
  matchesByStage,
  predictionsByMatch,
}: {
  matchesByStage: MatchesByStage
  /** Pronósticos del usuario indexados por id de partido. */
  predictionsByMatch: Record<string, PlayoffPrediction>
}) {
  const bracket = useMemo(() => buildBracket(matchesByStage), [matchesByStage])
  const currentStage = getCurrentStage(bracket)
  const [chosenStage, setChosenStage] = useState<PlayoffStage | null>(null)
  const panelId = useId()

  // Si el usuario no eligió, la ronda en curso. Si eligió una que dejó de existir
  // (cambió el torneo), también.
  const selectedStage =
    bracket.rounds.find(round => round.stage === chosenStage)?.stage ?? currentStage
  const selectedRound = bracket.rounds.find(round => round.stage === selectedStage)

  const renderCard = (slot: BracketSlot) => (
    <BracketMatchCard
      slot={slot}
      prediction={slot.match ? (predictionsByMatch[slot.match.id] ?? null) : null}
    />
  )

  // Fuera del cuadro: no alimenta ninguna ronda, así que no lleva conectores.
  const thirdPlaceBlock = bracket.thirdPlace && (
    <div className={styles.thirdPlace}>
      <h4 className={styles.thirdPlaceTitle}>Tercer puesto</h4>
      {renderCard(bracket.thirdPlace)}
    </div>
  )

  return (
    <div>
      <div className={styles.mobile}>
        {selectedStage && selectedRound && (
          <>
            <StageTabs
              rounds={bracket.rounds}
              selected={selectedStage}
              onSelect={setChosenStage}
              panelId={panelId}
            />
            <div
              role="tabpanel"
              id={panelId}
              aria-labelledby={getStageTabId(panelId, selectedStage)}
              className={styles.panel}
            >
              {[...selectedRound.slots].sort(byDate).map((slot, index) => (
                <div key={slot.match?.id ?? `vacio-${index}`}>{renderCard(slot)}</div>
              ))}
              {selectedStage === 'final' && thirdPlaceBlock}
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
              {round.stage === 'final' && thirdPlaceBlock ? (
                // Filas `1fr auto 1fr`: la final queda centrada entre sus semis y el
                // tercer puesto ocupa la fila de abajo sin correrla. Si no entra, las
                // dos filas `1fr` crecen igual y la final sigue en el medio.
                <div className={styles.slots} style={{ gridTemplateRows: '1fr auto 1fr' }}>
                  <div aria-hidden="true" />
                  <div className={styles.slot}>
                    <div className={styles.cardWrap}>{renderCard(round.slots[0])}</div>
                  </div>
                  {thirdPlaceBlock}
                </div>
              ) : (
                <div
                  className={styles.slots}
                  style={{ gridTemplateRows: `repeat(${round.slots.length}, 1fr)` }}
                >
                  {round.slots.map((slot, index) => (
                    <div key={slot.match?.id ?? `vacio-${index}`} className={styles.slot}>
                      <div className={styles.cardWrap}>{renderCard(slot)}</div>
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
