import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTournament } from '../../contexts/TournamentContext'
import { useRounds } from '../../hooks/useRounds'
import { useMatches } from '../../hooks/useMatches'
import { getRoundDisplayName } from '../../utils/roundLabels'
import { showsMatchNumber } from '../../utils/matchNumber'
import Button from '../Common/Button'
import LoadingState from '../Common/LoadingState'
import SelectDropdown from '../Common/SelectDropdown'
import MatchupLogos from '../Common/MatchupLogos'
import DateTimeInput from '../Common/DateTimeInput'
import Toast from '../Common/Toast'
import PageHeader from '../Common/PageHeader'
import { useMatchesMeta } from '../../hooks/useMatchesMeta'
import { getPreviousTime, hasScheduleChanged, toDatetimeLocalValue, toUtcIso } from './schedule'
import styles from './AdminMatchSchedule.module.css'

export default function AdminMatchSchedule() {
  const { activeTournament } = useTournament()
  const { rounds, activeRound, loading: roundsLoading } = useRounds(activeTournament?.id)
  const { matchesMeta } = useMatchesMeta(activeTournament?.id)
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
    if (selectedRound || roundsLoading) return
    const withMatches = matchesMeta.map(match => match.round_number)
    const fallback = withMatches.length > 0 ? Math.max(...withMatches) : null
    setSelectedRound(activeRound?.round_number ?? fallback)
  }, [activeRound, matchesMeta, roundsLoading, selectedRound])

  /**
   * Los inputs se rellenan con el horario que está en la base.
   *
   * El estado se re-setea solo si de verdad cambió algo. Dos motivos: guardar
   * invalida la query, y con la respuesta nueva este efecto pisaba lo que el
   * admin estuviera tipeando; y si `matches` volviera a llegar con una
   * referencia nueva en cada render, devolver `prev` corta el bucle en vez de
   * encadenar renders (era el "Maximum update depth exceeded" del panel).
   */
  useEffect(() => {
    setScheduleValues(prev => {
      const next = {}
      matches.forEach(match => {
        next[match.id] = toDatetimeLocalValue(match.match_date)
      })

      const ids = Object.keys(next)
      const igual =
        ids.length === Object.keys(prev).length && ids.every(id => prev[id] === next[id])

      return igual ? prev : next
    })
  }, [matches])

  const pendingChanges = useMemo(() => {
    return matches.filter(match => hasScheduleChanged(match.match_date, scheduleValues[match.id]))
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
      setToast({
        message: `${successCount} horario${successCount > 1 ? 's' : ''} actualizado${successCount > 1 ? 's' : ''}`,
        type: 'success',
      })
    } else if (successCount > 0 && errorCount > 0) {
      setToast({
        message: `${successCount} actualizado${successCount > 1 ? 's' : ''}, ${errorCount} falló${errorCount > 1 ? 'n' : ''}`,
        type: 'warning',
      })
    } else {
      setToast({ message: 'No se pudieron guardar los horarios', type: 'error' })
    }
  }, [pendingChanges, scheduleValues, updateMatch])

  if (roundsLoading) {
    return (
      <div className={styles.container}>
        <LoadingState message="Cargando fechas del torneo..." />
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <PageHeader icon="🕒" title="Horarios" centered />

      <div className={styles.picker}>
        <SelectDropdown
          label="Fecha del torneo"
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
        <p className={styles.empty}>Seleccioná una fecha para ver y modificar los horarios.</p>
      ) : matchesLoading ? (
        <LoadingState message="Cargando partidos..." />
      ) : matches.length === 0 ? (
        <p className={styles.empty}>No hay partidos cargados para esta fecha.</p>
      ) : (
        <>
          <ul className={styles.list}>
            {matches.map(match => {
              const value = scheduleValues[match.id] ?? ''
              const previous = getPreviousTime(match.match_date, value)

              return (
                <li key={match.id} className={styles.card} data-changed={previous !== null}>
                  <span id={`teams-${match.id}`} className={styles.matchup}>
                    <MatchupLogos home={match.home_team} away={match.away_team} middle="vs" />
                  </span>
                  <div className={styles.date}>
                    <DateTimeInput
                      value={value}
                      ariaLabelledBy={`teams-${match.id}`}
                      onChange={event => handleValueChange(match.id, event.target.value)}
                    />
                  </div>
                  {(previous || showsMatchNumber(match)) && (
                    <p className={styles.extra}>
                      {showsMatchNumber(match) && `Partido ${match.match_number}`}
                      {showsMatchNumber(match) && previous && ' · '}
                      {previous && <span className={styles.previous}>antes: {previous}</span>}
                    </p>
                  )}
                </li>
              )
            })}
          </ul>

          <div className={styles.saveBar}>
            <Button
              variant="success"
              size="lg"
              onClick={handleSaveAll}
              disabled={saving || pendingChanges.length === 0}
              fullWidth
            >
              {saving
                ? 'Guardando horarios...'
                : pendingChanges.length > 0
                  ? `Guardar cambios (${pendingChanges.length})`
                  : 'Guardar cambios'}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
