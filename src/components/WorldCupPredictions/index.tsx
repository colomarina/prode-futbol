import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useTournament } from '../../contexts/TournamentContext'
import { useWorldCupBonus } from '../../hooks/useWorldCupBonus'
import Button from '../Common/Button'
import SelectDropdown from '../Common/SelectDropdown'
import TextInput from '../Common/TextInput'
import FormField from '../Common/FormField'
import Toast from '../Common/Toast'
import LoadingState from '../Common/LoadingState'
import TeamOption from '../Common/TeamOption'
import EmptyState from '../Common/EmptyState'
import {
  ARGENTINA_STAGE_OPTIONS,
  DEBUTANT_TEAM_SLUGS,
  FINAL_GOALS_OPTIONS,
  HAT_TRICK_OPTIONS,
  WORLD_CUP_BONUS_MAX_POINTS,
  WORLD_CUP_BONUS_QUESTIONS,
} from '../../constants/worldCupBonus'

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
  const { activeTournament, isReadOnly } = useTournament()
  const { config, teams, prediction, bonusScore, loading, error, upsertPrediction, fetchData } =
    useWorldCupBonus(activeTournament?.id)

  const [toast, setToast] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(buildInitialValues(prediction))

  useEffect(() => {
    setForm(buildInitialValues(prediction))
  }, [prediction])

  const isWorldCupTournament = activeTournament?.type === 'world_cup'
  // El lock del mundial es un flag manual en DB: si el admin nunca lo cerró, un torneo ya
  // terminado quedaría con el formulario abierto. Por eso el modo consulta también bloquea.
  const isLocked = Boolean(
    isReadOnly || config?.is_locked || (config?.lock_at && new Date() >= new Date(config.lock_at))
  )

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

    const podium = [form.champion_team_id, form.runner_up_team_id, form.third_place_team_id].filter(
      Boolean
    )
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

  // `preventDefault` porque el guardado va por Supabase: sin esto Enter en una
  // respuesta de texto recarga la pagina y se pierden las 13 respuestas.
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    handleSave()
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
      <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
        <h2 style={{ marginBottom: 'var(--space-sm)' }}>Predicciones Mundialistas</h2>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
          Bonus maximo: {WORLD_CUP_BONUS_MAX_POINTS} puntos para la tabla general.
        </p>
        <p
          style={{
            margin: 'var(--space-sm) 0 0',
            color: 'var(--color-text-secondary)',
            fontWeight: 600,
          }}
        >
          Progreso: {completedCount}/{totalQuestions} respuestas completas
        </p>
        <div
          style={{
            marginTop: 'var(--space-md)',
            fontWeight: 600,
            color: isLocked ? 'var(--color-error)' : 'var(--color-success)',
          }}
        >
          {isLocked
            ? 'Estado: Bloqueado. Ya no se pueden editar respuestas.'
            : `Estado: Abierto${config?.lock_at ? ` hasta ${new Date(config.lock_at).toLocaleString('es-AR')}` : ''}`}
        </div>
        {bonusScore && (
          <div
            style={{
              marginTop: 'var(--space-sm)',
              color: 'var(--color-primary-text)',
              fontWeight: 700,
            }}
          >
            Tu bonus actual calculado: {bonusScore.total_points} pts
          </div>
        )}
      </div>

      {/* El form arranca en la tarjeta de preguntas: la de arriba es solo lectura. */}
      <form onSubmit={handleSubmit} style={{ margin: 0 }}>
        <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {WORLD_CUP_BONUS_QUESTIONS.map(question => {
              /*
               * La etiqueta se arma una vez y se le pasa al control, en vez de quedar
               * en un `<label>` al lado.
               *
               * El `<label className="form-label">` que habia no estaba asociado a
               * nada: los 13 controles de esta pantalla quedaban sin nombre para un
               * lector de pantalla. Los dropdowns no son un `<select>`, asi que un
               * `htmlFor` no tiene a que apuntar; se nombran con su prop `label`. El
               * campo de texto va con `FormField`, que genera el id y lo inyecta.
               *
               * Es un cambio visualmente neutro: el `.label` de `SelectDropdown` y el
               * de `FormField` replican `.form-label`, y los 8px de separacion salen
               * del `margin-bottom` en un caso y del `gap` en el otro.
               */
              const etiqueta = (
                <>
                  {question.label}
                  <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                    {' '}
                    ({question.points} pts)
                  </span>
                </>
              )

              return (
                <div
                  key={question.key}
                  style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-md)',
                    backgroundColor: 'var(--color-surface-variant)',
                  }}
                >
                  {question.type === 'team' && (
                    <SelectDropdown
                      label={etiqueta}
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
                      renderButton={team => <TeamOption team={team} />}
                      renderOption={team => <TeamOption team={team} />}
                    />
                  )}

                  {question.type === 'text' && (
                    <FormField label={etiqueta}>
                      <TextInput
                        value={form[question.key]}
                        onChange={event => updateField(question.key, event.target.value)}
                        placeholder="Respuesta"
                        disabled={isLocked}
                      />
                    </FormField>
                  )}

                  {question.type === 'number' && (
                    <SelectDropdown
                      label={etiqueta}
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
                      label={etiqueta}
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
                      label={etiqueta}
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
              )
            })}
          </div>
        </div>

        {!isLocked && (
          <div
            style={{
              marginTop: 'var(--space-xl)',
              position: 'sticky',
              bottom: '20px',
              zIndex: 'var(--z-sticky)',
            }}
          >
            <Button type="submit" size="lg" fullWidth disabled={saving || !hasAnyAnswer}>
              <span style={{ fontSize: 'var(--font-size-xl)' }}>{saving ? '⏳' : '💾'}</span>
              <span>{saving ? 'Guardando...' : 'Guardar y completar despues'}</span>
            </Button>
          </div>
        )}
      </form>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
