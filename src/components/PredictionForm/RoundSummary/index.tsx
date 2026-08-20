import { PREDICTION_CUTOFF_MINUTES } from '../../../utils/matchTiming'
import { getRoundDisplayName } from '../../../utils/roundLabels'
import type { Round } from '../../../types/domain'
import styles from './RoundSummary.module.css'

/**
 * El cartel de arriba del formulario: qué fecha se está mirando y si se puede
 * escribir en ella.
 *
 * Los minutos del texto salen de `PREDICTION_CUTOFF_MINUTES` y no de un "10"
 * escrito a mano, que es la regla de `utils/matchTiming.ts`: si algún día el corte
 * cambia, el mensaje no queda mintiendo.
 */
export default function RoundSummary({
  round,
  isReadOnly,
  allMatchesLocked,
}: {
  round?: Round
  isReadOnly?: boolean
  allMatchesLocked?: boolean
}) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.box}>
        <span className={styles.title}>
          {round ? getRoundDisplayName(round) : 'Fecha seleccionada'}
        </span>
        <p className={styles.description}>
          {isReadOnly
            ? 'Este torneo ya terminó. Estás viendo el histórico de pronósticos y resultados.'
            : allMatchesLocked
              ? `Todos los partidos de esta fecha ya superaron el límite de edición: podés cargar pronósticos hasta ${PREDICTION_CUTOFF_MINUTES} minutos antes del horario de cada partido.`
              : `Todavía podés cargar y actualizar pronósticos en los partidos que sigan habilitados. El límite es ${PREDICTION_CUTOFF_MINUTES} minutos antes del horario de cada partido.`}
        </p>
      </div>
    </div>
  )
}
