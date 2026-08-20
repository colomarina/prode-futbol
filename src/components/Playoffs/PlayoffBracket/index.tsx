import { memo } from 'react'
import PlayoffMatch from '../PlayoffMatch'
import styles from './PlayoffBracket.module.css'

const STAGE_ORDER = ['32avos', '16avos', 'octavos', 'cuartos', 'semifinal', 'final']

const STAGE_LABELS = {
  '32avos': '32avos de Final',
  '16avos': '16avos de Final',
  octavos: 'Octavos',
  cuartos: 'Cuartos',
  semifinal: 'Semifinales',
  final: 'Final',
}

const BRACKET_SLOT_HEIGHT = 66
const BRACKET_BASE_GAP = 12
const BRACKET_UNIT = BRACKET_SLOT_HEIGHT + BRACKET_BASE_GAP

import type { CSSProperties } from 'react'
import type { MatchesByStage, PlayoffPrediction } from '../../../hooks/usePlayoffs'

/**
 * La columna de una ronda. No depende del índice: hubo una versión que sí, y la
 * llamada seguía pasándoselo aunque la función ya no lo usara.
 */
const getColumnStyle = (): CSSProperties => ({
  minWidth: '220px',
  flex: '0 0 220px',
  paddingTop: '0',
})

const getStackStyle = (stageIndex: number): CSSProperties => {
  const step = Math.pow(2, stageIndex) * BRACKET_UNIT
  const gap = Math.max(8, step - BRACKET_SLOT_HEIGHT)
  const marginTop = stageIndex === 0 ? 0 : ((Math.pow(2, stageIndex) - 1) * BRACKET_UNIT) / 2

  return {
    display: 'flex',
    flexDirection: 'column',
    gap: `${gap}px`,
    marginTop: `${marginTop}px`,
  }
}

const teamNameStyle: CSSProperties = {
  margin: 0,
  color: 'var(--color-text-primary)',
  fontSize: 'var(--font-size-sm)',
  fontWeight: '700',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

const teamRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-sm)',
  minWidth: 0,
}

/**
 * El escudo va con `alt=""`: `teamNameStyle` renderiza el nombre al lado y el
 * recorte es solo visual (`text-overflow: ellipsis`), asi que el texto completo
 * esta en el DOM y un lector de pantalla lo lee igual. Poner el nombre en el
 * `alt` lo anunciaria dos veces.
 */
const logoStyle: CSSProperties = {
  width: '14px',
  height: '14px',
  objectFit: 'contain',
  flexShrink: 0,
}

const buildStageSlots = stageList => {
  const slotsByStage = {}
  let previousCount = 0

  stageList.forEach((stage, index) => {
    const matches = stage.matches || []
    const expectedCount =
      index === 0
        ? Math.max(matches.length, 1)
        : Math.max(matches.length, Math.ceil(previousCount / 2), 1)
    const slots = Array.from(
      { length: expectedCount },
      (_, slotIndex) => matches[slotIndex] || null
    )

    slotsByStage[stage.id] = slots
    previousCount = expectedCount
  })

  return slotsByStage
}

const PlayoffBracket = memo(function PlayoffBracket({
  matchesByStage,
  predictionsByMatch,
}: {
  matchesByStage: MatchesByStage
  /** Pronósticos del usuario indexados por id de partido. */
  predictionsByMatch: Record<string, PlayoffPrediction>
}) {
  const firstPopulatedStageIndex = STAGE_ORDER.findIndex(
    stage => (matchesByStage[stage] || []).length > 0
  )
  const startIndex =
    firstPopulatedStageIndex >= 0 ? firstPopulatedStageIndex : STAGE_ORDER.indexOf('octavos')
  const visibleStages = STAGE_ORDER.slice(Math.max(0, startIndex))
  const stageDescriptors = visibleStages.map(stage => ({
    id: stage,
    matches: matchesByStage[stage] || [],
  }))
  const mobileStageDescriptors = [...stageDescriptors]
    .filter(stage => stage.matches.length > 0)
    .reverse()
  const slotsByStage = buildStageSlots(stageDescriptors)

  return (
    <div>
      <div className={styles.mobile}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {mobileStageDescriptors.map(stage => (
            <section key={stage.id} className="card" style={{ padding: 'var(--space-md)' }}>
              <h3
                style={{
                  margin: '0 0 var(--space-sm) 0',
                  color: 'var(--color-primary-text)',
                  fontSize: 'var(--font-size-base)',
                  borderBottom: '1px solid var(--color-border)',
                  paddingBottom: 'var(--space-xs)',
                }}
              >
                {STAGE_LABELS[stage.id] || stage.id}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {(stage.matches || []).map(match => (
                  <PlayoffMatch
                    key={match.id}
                    match={match}
                    prediction={predictionsByMatch[match.id] || null}
                  />
                ))}

                {(stage.matches || []).length === 0 && (
                  <p
                    style={{
                      margin: 0,
                      color: 'var(--color-text-secondary)',
                      fontSize: 'var(--font-size-md)',
                      textAlign: 'center',
                      padding: 'var(--space-sm) 0',
                    }}
                  >
                    Sin cruces cargados aún.
                  </p>
                )}
              </div>
            </section>
          ))}
        </div>
      </div>

      <div className={styles.desktop}>
        <div
          style={{
            overflowX: 'auto',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-lg)',
            background:
              'radial-gradient(circle at 0% 0%, var(--color-surface-highlight), transparent 45%), var(--color-surface)',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 'var(--space-md)',
              minWidth: '980px',
              alignItems: 'flex-start',
            }}
          >
            {stageDescriptors.map((stage, stageIndex) => (
              <section key={stage.id} style={getColumnStyle()}>
                <h3
                  style={{
                    margin: '0 0 var(--space-md) 0',
                    fontSize: 'var(--font-size-base)',
                    color: 'var(--color-primary-text)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    borderBottom: '1px solid var(--color-border)',
                    paddingBottom: 'var(--space-xs)',
                  }}
                >
                  {STAGE_LABELS[stage.id] || stage.id}
                </h3>
                <div style={getStackStyle(stageIndex)}>
                  {(slotsByStage[stage.id] || []).map((match, index) => (
                    <div
                      key={`${stage.id}-${match?.id || `slot-${index}`}`}
                      style={{ position: 'relative' }}
                    >
                      {match ? (
                        <article
                          style={{
                            minHeight: `${BRACKET_SLOT_HEIGHT}px`,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            borderRadius: 'var(--radius-md)',
                            padding: 'var(--space-sm) var(--space-sm)',
                            backgroundColor: 'var(--color-surface-variant)',
                            border: '1px solid var(--color-border)',
                            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.06)',
                          }}
                        >
                          <div style={teamRowStyle}>
                            {match.home_team?.logo_url ? (
                              <img
                                src={match.home_team.logo_url}
                                alt=""
                                loading="lazy"
                                style={logoStyle}
                              />
                            ) : (
                              <span style={{ fontSize: 'var(--font-size-sm)' }}>⚽</span>
                            )}
                            <p style={teamNameStyle}>{match.home_team?.name || 'A confirmar'}</p>
                          </div>
                          <div style={{ ...teamRowStyle, marginTop: 'var(--space-2xs)' }}>
                            {match.away_team?.logo_url ? (
                              <img
                                src={match.away_team.logo_url}
                                alt=""
                                loading="lazy"
                                style={logoStyle}
                              />
                            ) : (
                              <span style={{ fontSize: 'var(--font-size-sm)' }}>⚽</span>
                            )}
                            <p style={teamNameStyle}>{match.away_team?.name || 'A confirmar'}</p>
                          </div>
                        </article>
                      ) : (
                        <article
                          style={{
                            minHeight: `${BRACKET_SLOT_HEIGHT}px`,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            borderRadius: 'var(--radius-md)',
                            padding: 'var(--space-sm) var(--space-sm)',
                            backgroundColor: 'var(--color-surface-variant)',
                            border: '1px dashed var(--color-border)',
                          }}
                        >
                          <div style={teamRowStyle}>
                            <span style={{ fontSize: 'var(--font-size-sm)' }}>⚽</span>
                            <p style={teamNameStyle}>A confirmar</p>
                          </div>
                          <div style={{ ...teamRowStyle, marginTop: 'var(--space-2xs)' }}>
                            <span style={{ fontSize: 'var(--font-size-sm)' }}>⚽</span>
                            <p style={teamNameStyle}>A confirmar</p>
                          </div>
                        </article>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
})

export default PlayoffBracket
