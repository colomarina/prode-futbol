import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTournament } from '../../contexts/TournamentContext'
import { useRounds } from '../../hooks/useRounds'
import { useMatches } from '../../hooks/useMatches'
import { getRoundDisplayName } from '../../utils/roundLabels'
import LoadingState from '../Common/LoadingState'
import SelectDropdown from '../Common/SelectDropdown'
import TeamDisplay from '../Common/TeamDisplay'
import DateTimeInput from '../Common/DateTimeInput'
import Toast from '../Common/Toast'

const toDatetimeLocalValue = value => {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const pad = number => String(number).padStart(2, '0')
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const toUtcIso = value => {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return date.toISOString()
}

const formatMatchDate = value => {
  if (!value) return 'Sin horario asignado'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Horario inválido'

  return date.toLocaleString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export default function AdminMatchSchedule() {
  const { activeTournament } = useTournament()
  const { rounds, loading: roundsLoading } = useRounds(activeTournament?.id)
  const [selectedRound, setSelectedRound] = useState(null)
  const [scheduleValues, setScheduleValues] = useState({})
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  const {
    matches,
    loading: matchesLoading,
    updateMatch,
  } = useMatches(selectedRound, activeTournament?.id)

  useEffect(() => {
    if (selectedRound || rounds.length === 0) return
    setSelectedRound(rounds[0]?.round_number ?? null)
  }, [rounds, selectedRound])

  useEffect(() => {
    const nextValues = {}
    matches.forEach(match => {
      nextValues[match.id] = toDatetimeLocalValue(match.match_date)
    })
    setScheduleValues(nextValues)
  }, [matches])

  const pendingChanges = useMemo(() => {
    return matches.filter(match => {
      const currentValue = toDatetimeLocalValue(match.match_date)
      return scheduleValues[match.id] !== undefined && scheduleValues[match.id] !== currentValue
    })
  }, [matches, scheduleValues])

  const handleValueChange = useCallback((matchId, value) => {
    setScheduleValues(prev => ({
      ...prev,
      [matchId]: value,
    }))
  }, [])

  const handleSaveAll = useCallback(async () => {
    if (pendingChanges.length === 0) {
      setToast({ message: 'No hay cambios de horario para guardar', type: 'warning' })
      return
    }

    const invalidValues = pendingChanges.some(match => {
      const value = scheduleValues[match.id]
      return !value || Number.isNaN(new Date(value).getTime())
    })

    if (invalidValues) {
      setToast({ message: 'Alguno de los horarios ingresados no es válido', type: 'error' })
      return
    }

    setSaving(true)

    const results = await Promise.all(
      pendingChanges.map(async match => {
        const isoDate = toUtcIso(scheduleValues[match.id])
        return updateMatch(match.id, { match_date: isoDate })
      })
    )

    const successCount = results.filter(result => !result.error).length
    const errorCount = results.filter(result => result.error).length

    setSaving(false)

    if (successCount > 0 && errorCount === 0) {
      setToast({ message: `${successCount} horario${successCount > 1 ? 's' : ''} actualizado${successCount > 1 ? 's' : ''}`, type: 'success' })
    } else if (successCount > 0 && errorCount > 0) {
      setToast({ message: `${successCount} actualizado${successCount > 1 ? 's' : ''}, ${errorCount} falló${errorCount > 1 ? 'n' : ''}`, type: 'warning' })
    } else {
      setToast({ message: 'No se pudieron guardar los horarios', type: 'error' })
    }
  }, [pendingChanges, scheduleValues, updateMatch])

  if (roundsLoading) {
    return (
      <div className="container" style={{ maxWidth: '1000px' }}>
        <LoadingState message="Cargando fechas del torneo..." />
      </div>
    )
  }

  return (
    <div className="container" style={{ maxWidth: '1000px' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="card" style={{ marginBottom: '16px' }}>
        <h2 style={{ marginBottom: '8px' }}>🕒 Reprogramar partidos</h2>
        <p style={{ marginTop: 0, color: 'var(--color-text-secondary)' }}>
          Ajustá los horarios de los partidos por fecha para cubrir aplazos, suspensiones o cambios de agenda.
        </p>

        <label className="form-label" style={{ display: 'block', marginBottom: '8px' }}>
          Fecha del torneo
        </label>
        <SelectDropdown
          items={rounds.map(round => ({ ...round, id: round.round_number }))}
          selectedId={selectedRound ?? ''}
          onSelect={value => setSelectedRound(Number(value))}
          placeholder="Seleccionar fecha..."
          valueKey="round_number"
          renderButton={round => <span>{getRoundDisplayName(round)}</span>}
          renderOption={round => <span>{getRoundDisplayName(round)}</span>}
        />
      </div>

      {!selectedRound ? (
        <div className="card">Seleccioná una fecha para ver y modificar los horarios.</div>
      ) : matchesLoading ? (
        <LoadingState message="Cargando partidos..." />
      ) : matches.length === 0 ? (
        <div className="card">No hay partidos cargados para esta fecha.</div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {matches.map(match => {
              const matchDateValue = scheduleValues[match.id] ?? ''
              const currentDateLabel = formatMatchDate(match.match_date)
              const hasChanges = scheduleValues[match.id] !== undefined && scheduleValues[match.id] !== toDatetimeLocalValue(match.match_date)

              return (
                <div key={match.id} className="card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: '240px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
                        <TeamDisplay team={match.home_team} size="md" />
                        <span style={{ fontWeight: '700', color: 'var(--color-primary)' }}>vs</span>
                        <TeamDisplay team={match.away_team} size="md" />
                      </div>

                      <div style={{ fontWeight: '700', marginBottom: '6px' }}>
                        Partido {match.match_number}
                      </div>
                      <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                        <div style={{ fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                          Horario actual
                        </div>
                        <div>{currentDateLabel}</div>
                        {hasChanges && (
                          <div style={{ marginTop: '4px', color: 'var(--color-warning)', fontWeight: '600' }}>
                            Cambiará al guardar
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ minWidth: '220px', width: '100%', maxWidth: '320px' }}>
                      <DateTimeInput
                        label="Horario"
                        value={matchDateValue}
                        onChange={event => handleValueChange(match.id, event.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ marginTop: '16px' }}>
            <button
              className="btn btn-success"
              onClick={handleSaveAll}
              disabled={saving || pendingChanges.length === 0}
              style={{ width: '100%' }}
            >
              {saving ? 'Guardando horarios...' : 'Guardar cambios'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
