import { useEffect, useState } from 'react'
import { useTournament } from '../../contexts/TournamentContext'
import { useWorldCupBonus } from '../../hooks/useWorldCupBonus'
import SelectDropdown from '../Common/SelectDropdown'
import TextInput from '../Common/TextInput'
import Toast from '../Common/Toast'
import LoadingState from '../Common/LoadingState'
import {
  ARGENTINA_STAGE_OPTIONS,
  DEBUTANT_TEAM_SLUGS,
  FINAL_GOALS_OPTIONS,
  HAT_TRICK_OPTIONS,
  getTeamFlagImageUrl,
  WORLD_CUP_BONUS_QUESTIONS,
} from '../../constants/worldCupBonus'

const TeamOptionContent = ({ team }) => {
  const flagUrl = team.logo_url || getTeamFlagImageUrl(team.slug)

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
      {flagUrl ? (
        <img
          src={flagUrl}
          alt=""
          width="20"
          height="14"
          loading="lazy"
          style={{ borderRadius: '2px', objectFit: 'cover', border: '1px solid rgba(0,0,0,0.12)' }}
        />
      ) : (
        <span>🏳️</span>
      )}
      <span>{team.name}</span>
    </span>
  )
}

const toForm = source => ({
  champion_team_id: source?.champion_team_id || '',
  runner_up_team_id: source?.runner_up_team_id || '',
  third_place_team_id: source?.third_place_team_id || '',
  top_scorer_text: source?.top_scorer_text || '',
  best_player_text: source?.best_player_text || '',
  best_goalkeeper_text: source?.best_goalkeeper_text || '',
  least_goals_conceded_team_id: source?.least_goals_conceded_team_id || '',
  revelation_team_id: source?.revelation_team_id || '',
  most_assists_text: source?.most_assists_text || '',
  most_cards_team_id: source?.most_cards_team_id || '',
  will_there_be_hat_trick:
    source?.will_there_be_hat_trick === null || source?.will_there_be_hat_trick === undefined
      ? null
      : source.will_there_be_hat_trick,
  argentina_stage: source?.argentina_stage || '',
  final_goals: source?.final_goals ?? '',
  best_debutant_team_id: source?.best_debutant_team_id || '',
})

export default function AdminWorldCupBonus() {
  const { activeTournament } = useTournament()
  const {
    config,
    teams,
    officialResults,
    stats,
    loading,
    error,
    adminSetLock,
    adminForceLock,
    adminUpsertOfficialResults,
    adminRecalculateBonus,
    fetchData,
  } = useWorldCupBonus(activeTournament?.id)

  const [toast, setToast] = useState(null)
  const [saving, setSaving] = useState(false)
  const [lockDate, setLockDate] = useState('')
  const [lockTime, setLockTime] = useState('18:00')
  const [resultsForm, setResultsForm] = useState(toForm(officialResults))

  useEffect(() => {
    setResultsForm(toForm(officialResults))
  }, [officialResults])

  useEffect(() => {
    if (!config?.lock_at) {
      setLockDate('')
      setLockTime('18:00')
      return
    }

    const lockDateObj = new Date(config.lock_at)
    const localDate = `${lockDateObj.getFullYear()}-${String(lockDateObj.getMonth() + 1).padStart(2, '0')}-${String(
      lockDateObj.getDate(),
    ).padStart(2, '0')}`
    const localTime = `${String(lockDateObj.getHours()).padStart(2, '0')}:${String(
      lockDateObj.getMinutes(),
    ).padStart(2, '0')}`

    setLockDate(localDate)
    setLockTime(localTime)
  }, [config?.lock_at])

  const isWorldCupTournament = activeTournament?.type === 'world_cup'

  const setField = (key, value) => {
    setResultsForm(prev => ({ ...prev, [key]: value }))
  }

  const onSaveLock = async () => {
    const lockAtIso =
      lockDate && lockTime ? new Date(`${lockDate}T${lockTime}`).toISOString() : null

    setSaving(true)
    const { error: rpcError } = await adminSetLock({
      enabled: true,
      lockAt: lockAtIso,
    })
    setSaving(false)

    if (rpcError) {
      setToast({ message: rpcError.message || 'Error al guardar lock', type: 'error' })
      return
    }

    setToast({ message: 'Configuracion de lock guardada', type: 'success' })
    fetchData()
  }

  const onForceLock = async () => {
    setSaving(true)
    const { error: rpcError } = await adminForceLock()
    setSaving(false)

    if (rpcError) {
      setToast({ message: rpcError.message || 'Error al bloquear', type: 'error' })
      return
    }

    setToast({ message: 'Predicciones bloqueadas manualmente', type: 'success' })
    fetchData()
  }

  const onSaveOfficialResults = async () => {
    setSaving(true)
    const { error: rpcError } = await adminUpsertOfficialResults(resultsForm)
    setSaving(false)

    if (rpcError) {
      setToast({ message: rpcError.message || 'Error al guardar resultados', type: 'error' })
      return
    }

    setToast({ message: 'Resultados oficiales guardados', type: 'success' })
    fetchData()
  }

  const onRecalculate = async () => {
    setSaving(true)
    const { error: rpcError } = await adminRecalculateBonus()
    setSaving(false)

    if (rpcError) {
      setToast({ message: rpcError.message || 'Error al recalcular', type: 'error' })
      return
    }

    setToast({ message: 'Bonus recalculado correctamente', type: 'success' })
    fetchData()
  }

  if (!isWorldCupTournament) {
    return (
      <div className="container" style={{ maxWidth: '1000px' }}>
        <div className="card">Esta seccion admin aplica solo a torneos Mundial.</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container" style={{ maxWidth: '1000px' }}>
        <LoadingState message="Cargando configuracion mundialista..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container" style={{ maxWidth: '1000px' }}>
        <div className="alert alert-error">{error}</div>
      </div>
    )
  }

  return (
    <div className="container" style={{ maxWidth: '1000px' }}>
      <div className="card" style={{ marginBottom: '16px' }}>
        <h2 style={{ marginBottom: '8px' }}>Admin Mundialistas</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: 0 }}>
          Predicciones recibidas: {stats.totalPredictions}
        </p>

        <div className="form-group">
          <label className="form-label">Calendario de bloqueo</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: '8px' }}>
            <input
              type="date"
              value={lockDate}
              onChange={event => setLockDate(event.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: '2px solid var(--color-border)',
              }}
            />
            <input
              type="time"
              value={lockTime}
              onChange={event => setLockTime(event.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: '2px solid var(--color-border)',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={onSaveLock} disabled={saving}>
            Guardar lock
          </button>
          <button className="btn btn-danger" onClick={onForceLock} disabled={saving}>
            Bloquear ahora
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '16px' }}>
        <h3 style={{ marginTop: 0 }}>Resultados oficiales</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {WORLD_CUP_BONUS_QUESTIONS.map(question => (
            <div
              key={question.key}
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                padding: '12px',
                backgroundColor: 'var(--color-surface-variant)',
              }}
            >
              <label className="form-label" style={{ marginBottom: '10px', display: 'block' }}>
                {question.label}
                <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                  {' '}
                  ({question.points} pts)
                </span>
              </label>
              {question.type === 'team' && (
                <SelectDropdown
                  items={question.key === 'best_debutant_team_id' ? teams.filter(team => DEBUTANT_TEAM_SLUGS.includes(team.slug)) : teams}
                  selectedId={resultsForm[question.key]}
                  onSelect={value => setField(question.key, value)}
                  valueKey="id"
                  placeholder={
                    question.key === 'best_debutant_team_id'
                      ? 'Seleccionar seleccion debutante'
                      : 'Seleccionar equipo'
                  }
                  renderButton={team => <TeamOptionContent team={team} />}
                  renderOption={team => <TeamOptionContent team={team} />}
                />
              )}
              {question.type === 'text' && (
                <TextInput
                  value={resultsForm[question.key]}
                  onChange={event => setField(question.key, event.target.value)}
                />
              )}
              {question.type === 'number' && (
                <SelectDropdown
                  items={FINAL_GOALS_OPTIONS}
                  selectedId={
                    resultsForm[question.key] === '' || resultsForm[question.key] === null
                      ? null
                      : Number(resultsForm[question.key])
                  }
                  onSelect={value => setField(question.key, value)}
                  valueKey="id"
                  placeholder="Seleccionar goles (0 a 10)"
                  renderButton={item => <span>{item.label}</span>}
                  renderOption={item => <span>{item.label}</span>}
                />
              )}
              {question.type === 'boolean' && (
                <SelectDropdown
                  items={HAT_TRICK_OPTIONS}
                  selectedId={
                    resultsForm[question.key] === null || resultsForm[question.key] === undefined
                      ? null
                      : resultsForm[question.key]
                  }
                  onSelect={value => setField(question.key, value)}
                  valueKey="id"
                  placeholder="Seleccionar opcion"
                  renderButton={item => <span>{item.label}</span>}
                  renderOption={item => <span>{item.label}</span>}
                />
              )}
              {question.type === 'stage' && (
                <SelectDropdown
                  items={ARGENTINA_STAGE_OPTIONS}
                  selectedId={resultsForm[question.key]}
                  onSelect={value => setField(question.key, value)}
                  valueKey="id"
                  placeholder="Seleccionar instancia"
                  renderButton={item => <span>{item.label}</span>}
                  renderOption={item => <span>{item.label}</span>}
                />
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={onSaveOfficialResults} disabled={saving}>
            Guardar resultados oficiales
          </button>
          <button className="btn btn-secondary" onClick={onRecalculate} disabled={saving}>
            Recalcular bonus
          </button>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
