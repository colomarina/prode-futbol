import { getTeamFlagImageUrl } from '../../../constants/worldCupBonus'
import type { TeamSummary } from '../../../types/domain'
import styles from './TeamOption.module.css'

/**
 * Bandera + nombre de un equipo, para las opciones de un dropdown.
 *
 * Estaba duplicado literal —las 19 líneas idénticas— en `WorldCupPredictions` y
 * en `AdminWorldCupBonus`, que son las dos pantallas mundialistas: una para que
 * el jugador responda las preguntas bonus y la otra para que el admin cargue los
 * resultados oficiales. Cada una tenía su propia copia del componente.
 *
 * TODO(mundial): las dos pantallas que lo usan quedaron sin validar en la fase 5
 * porque el Mundial se juega en 2026 y no hay datos para probarlas.
 */
export default function TeamOption({ team }: { team: TeamSummary }) {
  const flagUrl = team.logo_url || getTeamFlagImageUrl(team.slug)

  return (
    <span className={styles.option}>
      {flagUrl ? (
        <img
          src={flagUrl}
          alt=""
          width="20"
          height="14"
          loading="lazy"
          className={styles.bandera}
        />
      ) : (
        <span>🏳️</span>
      )}
      <span>{team.name}</span>
    </span>
  )
}
