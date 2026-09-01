import SelectDropdown from '../../Common/SelectDropdown'
import type { MatchWithTeams, Uuid } from '../../../types/domain'

interface MatchSelectorProps {
  matches: MatchWithTeams[]
  selectedMatchId: Uuid | null
  onMatchChange: (id: Uuid | null) => void
  disabled?: boolean
  isLoading?: boolean
}

/**
 * Los `alt` de los escudos son distintos en las dos ramas, y es a proposito:
 *
 * - En `renderOption` el nombre de los dos equipos esta escrito al lado
 *   ("Boca vs River"), asi que el escudo es decorativo: va `alt=""` para que no
 *   se anuncie dos veces.
 * - En `renderButton` el unico texto es "vs": ahi el escudo es el unico
 *   identificador del equipo, asi que el `alt` lleva el nombre.
 */
const MatchSelector = ({
  matches,
  selectedMatchId,
  onMatchChange,
  disabled,
  isLoading,
}: MatchSelectorProps) => {
  return (
    <SelectDropdown
      label="⚽ Seleccionar Partido"
      items={matches}
      selectedId={selectedMatchId}
      onSelect={onMatchChange}
      disabled={disabled}
      isLoading={isLoading}
      placeholder="Seleccionar partido..."
      renderButton={match => (
        <>
          #{match.match_number}
          {match.group_label ? ` (${match.group_label})` : ''} -
          {match.home_team?.logo_url && (
            <img
              src={match.home_team.logo_url}
              alt={match.home_team.name}
              style={{ width: '24px', height: '24px', objectFit: 'contain' }}
            />
          )}
          <span
            style={{
              fontSize: 'var(--font-size-md)',
              fontWeight: '600',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            vs
          </span>
          {match.away_team?.logo_url && (
            <img
              src={match.away_team.logo_url}
              alt={match.away_team.name}
              style={{ width: '24px', height: '24px', objectFit: 'contain' }}
            />
          )}
        </>
      )}
      renderOption={match => (
        <>
          #{match.match_number}
          {match.group_label ? ` (${match.group_label})` : ''} -
          {match.home_team?.logo_url && (
            <img
              src={match.home_team.logo_url}
              alt=""
              loading="lazy"
              style={{ width: '28px', height: '28px', objectFit: 'contain' }}
            />
          )}
          <span style={{ flex: 1, fontWeight: '600' }}>
            {match.home_team?.name || 'Local'} vs {match.away_team?.name || 'Visitante'}
          </span>
          {match.away_team?.logo_url && (
            <img
              src={match.away_team.logo_url}
              alt=""
              loading="lazy"
              style={{ width: '28px', height: '28px', objectFit: 'contain' }}
            />
          )}
        </>
      )}
    />
  )
}

export default MatchSelector
