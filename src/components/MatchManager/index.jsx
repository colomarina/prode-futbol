import { useState, useCallback, useMemo } from 'react'
import { useRounds } from '../../hooks/useRounds'
import { useMatches } from '../../hooks/useMatches'
import { useMatchesMeta } from '../../hooks/useMatchesMeta'
import { useTournament } from '../../contexts/TournamentContext'
import { getRoundDisplayName } from '../../utils/roundLabels'
import { canLoadResult, RESULT_LOAD_DELAY_HOURS } from '../../utils/matchTiming'
import MatchResult from './MatchResult'
import Toast from '../Common/Toast'
import SelectDropdown from '../Common/SelectDropdown'
import EmptyState from '../Common/EmptyState'

export default function MatchManager() {
  const { activeTournament } = useTournament()
  const { rounds } = useRounds(activeTournament?.id)
  const [selectedRound, setSelectedRound] = useState(null)
  // Comparte cache con useRounds: antes este componente repetia la misma query
  // por su cuenta, y ademas se tragaba el error en un catch vacio.
  const { matchesMeta, error: matchesMetaError } = useMatchesMeta(activeTournament?.id)
  const {
    matches,
    loading: matchesLoading,
    updateMatch,
  } = useMatches(selectedRound, activeTournament?.id)
  const [resultValues, setResultValues] = useState({})
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  const closedRounds = useMemo(
    () =>
      rounds.filter(round =>
        matchesMeta.some(
          match => match.round_number === round.round_number && canLoadResult(match.match_date)
        )
      ),
    [matchesMeta, rounds]
  )

  const handleValueChange = useCallback((matchId, field, value) => {
    setResultValues(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [field]: value,
      },
    }))
  }, [])

  const handleSaveAll = useCallback(async () => {
    setSaving(true)

    const validMatches = matches.filter(match => {
      const values = resultValues[match.id]
      return (
        values?.home !== undefined &&
        values?.home !== '' &&
        values?.away !== undefined &&
        values?.away !== ''
      )
    })

    if (validMatches.length === 0) {
      setToast({
        message: 'No hay resultados para guardar',
        type: 'warning',
      })
      setSaving(false)
      return
    }

    const results = await Promise.all(
      validMatches.map(async match => {
        const values = resultValues[match.id]
        const home = parseInt(values.home, 10)
        const away = parseInt(values.away, 10)

        let qualifierTeamId = null
        if (match.is_playoff) {
          if (home > away) {
            qualifierTeamId = match.home_team_id
          } else if (away > home) {
            qualifierTeamId = match.away_team_id
          } else {
            qualifierTeamId = values.qualifier || match.qualifier_team_id || match.home_team_id
          }
        }

        return updateMatch(match.id, {
          home_score: home,
          away_score: away,
          is_finished: true,
          ...(match.is_playoff ? { qualifier_team_id: qualifierTeamId } : {}),
        })
      })
    )

    const successCount = results.filter(result => !result.error).length
    const errorCount = results.filter(result => result.error).length

    setSaving(false)

    if (successCount > 0 && errorCount === 0) {
      setToast({
        message: `${successCount} resultado${successCount > 1 ? 's' : ''} guardado${successCount > 1 ? 's' : ''} correctamente`,
        type: 'success',
      })
      setResultValues({}) // Limpiar valores después de guardar
    } else if (successCount > 0 && errorCount > 0) {
      setToast({
        message: `${successCount} guardado${successCount > 1 ? 's' : ''}, ${errorCount} fallaron`,
        type: 'warning',
      })
    } else if (errorCount > 0) {
      setToast({
        message: 'Error al guardar resultados. Intentá de nuevo.',
        type: 'error',
      })
    }
  }, [matches, resultValues, updateMatch])

  // Verificar si hay al menos un resultado para guardar
  const hasValidResults = useMemo(
    () =>
      Object.values(resultValues).some(
        v => v?.home !== undefined && v?.home !== '' && v?.away !== undefined && v?.away !== ''
      ),
    [resultValues]
  )

  return (
    <div className="container" style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: '16px', textAlign: 'center' }}>
        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: 'var(--color-primary)',
            marginBottom: '8px',
          }}
        >
          ⚙️ Cargar Resultados
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
          Seleccioná una fecha cerrada y cargá los resultados de los partidos
        </p>
      </div>

      {/* Selector de fecha */}
      <div style={{ marginBottom: '16px' }}>
        <SelectDropdown
          items={closedRounds}
          selectedId={selectedRound}
          onSelect={roundNumber => {
            setSelectedRound(roundNumber)
            setResultValues({}) // Limpiar valores al cambiar de fecha
          }}
          placeholder="Seleccionar fecha..."
          valueKey="round_number"
          renderButton={round => getRoundDisplayName(round)}
          renderOption={round => getRoundDisplayName(round)}
        />
      </div>

      {/* Un select vacío no explica nada por sí solo: puede ser que la carga
          falló o que todavía ninguna fecha cumple el delay de RESULT_LOAD_DELAY_HOURS. */}
      {closedRounds.length === 0 &&
        (matchesMetaError ? (
          <EmptyState
            icon="⚠️"
            title="No se pudieron cargar los partidos del torneo"
            description="Probá recargar la página. Si sigue pasando, revisá la conexión con la base."
          />
        ) : (
          <EmptyState
            icon="🕒"
            title="Todavía no hay fechas para cargar"
            description={`Una fecha aparece acá recién ${RESULT_LOAD_DELAY_HOURS} horas después de que empiece alguno de sus partidos, para no cargar resultados de partidos en curso.`}
          />
        ))}

      {/* Lista de partidos */}
      {selectedRound ? (
        matchesLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--color-text-secondary)' }}>Cargando partidos...</p>
          </div>
        ) : !matches || matches.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 16px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚽</div>
            <h3 style={{ color: 'var(--color-text-primary)', marginBottom: '8px' }}>
              No hay partidos en esta fecha
            </h3>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Todavía no se cargaron partidos para esta fecha.
            </p>
          </div>
        ) : (
          <>
            {/* Lista de partidos */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {matches.map(match => (
                <MatchResult
                  key={`${match.round_number}-${match.match_number}-${match.id}`}
                  match={match}
                  resultValues={resultValues}
                  onValueChange={handleValueChange}
                />
              ))}
            </div>

            {/* Botón para guardar todos */}
            <div style={{ marginTop: '24px', position: 'sticky', bottom: '20px', zIndex: 10 }}>
              <button
                onClick={handleSaveAll}
                disabled={saving || !hasValidResults}
                className="btn-success"
                style={{
                  width: '100%',
                  padding: '18px',
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  opacity: saving || !hasValidResults ? 0.6 : 1,
                  cursor: saving || !hasValidResults ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>{saving ? '⏳' : '💾'}</span>
                <span>{saving ? 'Guardando...' : 'Guardar Todos los Resultados'}</span>
              </button>
            </div>
          </>
        )
      ) : (
        <div style={{ textAlign: 'center', padding: '48px 16px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📅</div>
          <h3 style={{ color: 'var(--color-text-primary)', marginBottom: '8px' }}>
            Seleccioná una fecha
          </h3>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Elegí una fecha cerrada para cargar los resultados
          </p>
        </div>
      )}

      {/* Toast notifications */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
