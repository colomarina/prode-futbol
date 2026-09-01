import Card from '../Card'
import SectionHeader from '../SectionHeader'
import TiebreakItem from './TiebreakItem'
import SpecialRulesBox from './SpecialRulesBox'
import { useTournament } from '../../../contexts/TournamentContext'
import { getTiebreakRules } from '../info.config'

export default function TiebreakSection() {
  const { activeTournament } = useTournament()
  const { tiebreakCriteria, specialRule } = getTiebreakRules(activeTournament?.slug)

  return (
    <Card color="var(--color-info)">
      <SectionHeader
        icon="⚽"
        title="REGLAMENTO DE DESEMPATE Y PREMIOS"
        color="var(--color-info)"
        centered
      />

      {/* Criterios de desempate */}
      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <h4
          style={{
            fontSize: 'var(--font-size-base)',
            fontWeight: '700',
            color: 'var(--color-info)',
            marginBottom: 'var(--space-md)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
          }}
        >
          <span>📌</span>
          <span>Criterio de desempate</span>
        </h4>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-sm)',
            paddingLeft: 'var(--space-sm)',
          }}
        >
          {tiebreakCriteria.map(criterion => (
            <TiebreakItem
              key={criterion.title}
              order={criterion.order}
              title={criterion.title}
              description={criterion.description}
            />
          ))}
        </div>
      </div>

      {/* Regla especial */}
      <SpecialRulesBox
        icon={specialRule.icon}
        title={specialRule.title}
        description={specialRule.description}
        note={specialRule.note}
      />
    </Card>
  )
}
