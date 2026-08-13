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

const getColumnStyle = () => ({
  minWidth: '220px',
  flex: '0 0 220px',
  paddingTop: '0px',
})

const getStackStyle = stageIndex => {
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

const teamNameStyle = {
  margin: 0,
  color: 'var(--color-text-primary)',
  fontSize: '0.82rem',
  fontWeight: '700',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

const teamRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  minWidth: 0,
}

const logoStyle = {
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

const PlayoffBracket = memo(function PlayoffBracket({ matchesByStage, predictionsByMatch }) {
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {mobileStageDescriptors.map(stage => (
            <section key={stage.id} className="card" style={{ padding: '12px' }}>
              <h3
                style={{
                  margin: '0 0 10px 0',
                  color: 'var(--color-primary)',
                  fontSize: '0.95rem',
                  borderBottom: '1px solid var(--color-border)',
                  paddingBottom: '6px',
                }}
              >
                {STAGE_LABELS[stage.id] || stage.id}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                      fontSize: '0.9rem',
                      textAlign: 'center',
                      padding: '8px 0',
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
            borderRadius: '16px',
            padding: '16px',
            background:
              'radial-gradient(circle at 0% 0%, var(--color-surface-highlight), transparent 45%), var(--color-surface)',
          }}
        >
          <div
            style={{ display: 'flex', gap: '14px', minWidth: '980px', alignItems: 'flex-start' }}
          >
            {stageDescriptors.map((stage, stageIndex) => (
              <section key={stage.id} style={getColumnStyle(stageIndex)}>
                <h3
                  style={{
                    margin: '0 0 12px 0',
                    fontSize: '0.95rem',
                    color: 'var(--color-primary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    borderBottom: '1px solid var(--color-border)',
                    paddingBottom: '6px',
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
                            borderRadius: '8px',
                            padding: '8px 10px',
                            backgroundColor: 'var(--color-surface-variant)',
                            border: '1px solid var(--color-border)',
                            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.06)',
                          }}
                        >
                          <div style={teamRowStyle}>
                            {match.home_team?.logo_url ? (
                              <img src={match.home_team.logo_url} alt="" style={logoStyle} />
                            ) : (
                              <span style={{ fontSize: '0.8rem' }}>⚽</span>
                            )}
                            <p style={teamNameStyle}>{match.home_team?.name || 'A confirmar'}</p>
                          </div>
                          <div style={{ ...teamRowStyle, marginTop: '4px' }}>
                            {match.away_team?.logo_url ? (
                              <img src={match.away_team.logo_url} alt="" style={logoStyle} />
                            ) : (
                              <span style={{ fontSize: '0.8rem' }}>⚽</span>
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
                            borderRadius: '8px',
                            padding: '8px 10px',
                            backgroundColor: 'var(--color-surface-variant)',
                            border: '1px dashed var(--color-border)',
                          }}
                        >
                          <div style={teamRowStyle}>
                            <span style={{ fontSize: '0.8rem' }}>⚽</span>
                            <p style={teamNameStyle}>A confirmar</p>
                          </div>
                          <div style={{ ...teamRowStyle, marginTop: '4px' }}>
                            <span style={{ fontSize: '0.8rem' }}>⚽</span>
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
