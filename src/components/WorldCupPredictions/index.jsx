import { useEffect, useState } from 'react'
import { useTournament } from '../../contexts/TournamentContext'
import { useWorldCupBonus } from '../../hooks/useWorldCupBonus'
import SelectDropdown from '../Common/SelectDropdown'
import TextInput from '../Common/TextInput'
import Toast from '../Common/Toast'
import LoadingState from '../Common/LoadingState'
import EmptyState from '../Common/EmptyState'
import {
  ARGENTINA_STAGE_OPTIONS,
  DEBUTANT_TEAM_SLUGS,
  FINAL_GOALS_OPTIONS,
  HAT_TRICK_OPTIONS,
  getTeamFlagImageUrl,
  WORLD_CUP_BONUS_MAX_POINTS,
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

const buildInitialValues = source => ({
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

export default function WorldCupPredictions() {
  const { activeTournament } = useTournament()
  const {
    config,
    teams,
    prediction,
    bonusScore,
    loading,
    error,
    upsertPrediction,
    fetchData,
  } = useWorldCupBonus(activeTournament?.id)

  const [toast, setToast] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(buildInitialValues(prediction))

  useEffect(() => {
    setForm(buildInitialValues(prediction))
  }, [prediction])

  const isWorldCupTournament = activeTournament?.type === 'world_cup'
  const isLocked = Boolean(config?.is_locked || (config?.lock_at && new Date() >= new Date(config.lock_at)))

  const isQuestionAnswered = question => {
    const value = form[question.key]
    if (question.type === 'boolean') return typeof value === 'boolean'
    if (question.type === 'text') return Boolean(String(value || '').trim())
    if (question.type === 'number') return value !== '' && value !== null && value !== undefined
    return Boolean(value)
  }

  const completedCount = WORLD_CUP_BONUS_QUESTIONS.filter(isQuestionAnswered).length
  const totalQuestions = WORLD_CUP_BONUS_QUESTIONS.length
  const hasAnyAnswer = completedCount > 0
  const debutantTeams = teams.filter(team => DEBUTANT_TEAM_SLUGS.includes(team.slug))

  const updateField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    if (!hasAnyAnswer) {
      setToast({ message: 'Completá al menos una respuesta antes de guardar.', type: 'warning' })
      return
    }

    const podium = [form.champion_team_id, form.runner_up_team_id, form.third_place_team_id].filter(Boolean)
    if (new Set(podium).size !== podium.length) {
      setToast({
        message: 'Campeon, subcampeon y tercer puesto deben ser selecciones distintas.',
        type: 'warning',
      })
      return
    }

    setSaving(true)
    const { error: saveError } = await upsertPrediction(form)
    setSaving(false)

    if (saveError) {
      setToast({ message: saveError.message || 'No se pudo guardar', type: 'error' })
      return
    }

    setToast({ message: 'Predicciones mundialistas guardadas', type: 'success' })
    fetchData()
  }

  if (!isWorldCupTournament) {
    return (
      <div className="container" style={{ maxWidth: '900px' }}>
        <EmptyState
          title="Predicciones Mundialistas"
          description="Esta seccion solo esta disponible para torneos tipo Mundial."
        />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container" style={{ maxWidth: '900px' }}>
        <LoadingState message="Cargando predicciones mundialistas..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container" style={{ maxWidth: '900px' }}>
        <div className="alert alert-error">{error}</div>
      </div>
    )
  }

  return (
    <div className="container" style={{ maxWidth: '980px' }}>
      <div className="card" style={{ marginBottom: '16px' }}>
        <h2 style={{ marginBottom: '8px' }}>Predicciones Mundialistas</h2>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
          Bonus maximo: {WORLD_CUP_BONUS_MAX_POINTS} puntos para la tabla general.
        </p>
        <p style={{ margin: '8px 0 0', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
          Progreso: {completedCount}/{totalQuestions} respuestas completas
        </p>
        <div style={{ marginTop: '12px', fontWeight: 600, color: isLocked ? 'var(--color-error)' : '#10b981' }}>
          {isLocked
            ? 'Estado: Bloqueado. Ya no se pueden editar respuestas.'
            : `Estado: Abierto${config?.lock_at ? ` hasta ${new Date(config.lock_at).toLocaleString('es-AR')}` : ''}`}
        </div>
        {bonusScore && (
          <div style={{ marginTop: '8px', color: 'var(--color-primary)', fontWeight: 700 }}>
            Tu bonus actual calculado: {bonusScore.total_points} pts
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: '16px' }}>
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
                  items={question.key === 'best_debutant_team_id' ? debutantTeams : teams}
                  selectedId={form[question.key]}
                  onSelect={value => updateField(question.key, value)}
                  valueKey="id"
                  placeholder={
                    question.key === 'best_debutant_team_id'
                      ? 'Seleccionar seleccion debutante'
                      : 'Seleccionar equipo'
                  }
                  disabled={isLocked}
                  renderButton={team => <TeamOptionContent team={team} />}
                  renderOption={team => <TeamOptionContent team={team} />}
                />
              )}

              {question.type === 'text' && (
                <TextInput
                  value={form[question.key]}
                  onChange={event => updateField(question.key, event.target.value)}
                  placeholder="Respuesta"
                  disabled={isLocked}
                />
              )}

              {question.type === 'number' && (
                <SelectDropdown
                  items={FINAL_GOALS_OPTIONS}
                  selectedId={
                    form[question.key] === '' || form[question.key] === null
                      ? null
                      : Number(form[question.key])
                  }
                  onSelect={value => updateField(question.key, value)}
                  valueKey="id"
                  placeholder="Seleccionar goles (0 a 10)"
                  disabled={isLocked}
                  renderButton={item => <span>{item.label}</span>}
                  renderOption={item => <span>{item.label}</span>}
                />
              )}

              {question.type === 'boolean' && (
                <SelectDropdown
                  items={HAT_TRICK_OPTIONS}
                  selectedId={
                    form[question.key] === null || form[question.key] === undefined
                      ? null
                      : form[question.key]
                  }
                  onSelect={value => updateField(question.key, value)}
                  valueKey="id"
                  placeholder="Seleccionar opcion"
                  disabled={isLocked}
                  renderButton={item => <span>{item.label}</span>}
                  renderOption={item => <span>{item.label}</span>}
                />
              )}

              {question.type === 'stage' && (
                <SelectDropdown
                  items={ARGENTINA_STAGE_OPTIONS}
                  selectedId={form[question.key]}
                  onSelect={value => updateField(question.key, value)}
                  valueKey="id"
                  placeholder="Seleccionar instancia"
                  disabled={isLocked}
                  renderButton={item => <span>{item.label}</span>}
                  renderOption={item => <span>{item.label}</span>}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {!isLocked && (
        <div style={{ marginTop: '24px', position: 'sticky', bottom: '20px', zIndex: 10 }}>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || !hasAnyAnswer}
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '1.05rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: saving || !hasAnyAnswer ? 0.65 : 1,
              cursor: saving || !hasAnyAnswer ? 'not-allowed' : 'pointer',
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.16)',
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>{saving ? '⏳' : '💾'}</span>
            <span>{saving ? 'Guardando...' : 'Guardar y completar despues'}</span>
          </button>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
