import Button from '../../Common/Button'
import { getRoundDisplayName, getRoundDisplayNameByNumber } from '../../../utils/roundLabels'
import type { Round } from '../../../types/domain'
import styles from './ActiveRoundShortcut.module.css'

/**
 * El atajo para volver a la fecha abierta cuando el usuario se fue a mirar otra.
 *
 * Quién decide si se muestra es el formulario: depende de la fecha seleccionada y
 * de si el torneo admite escrituras, y en modo consulta no hay ninguna fecha
 * abierta a la que ir.
 */
export default function ActiveRoundShortcut({
  activeRound,
  rounds,
  onGo,
}: {
  activeRound: Round
  rounds?: Round[]
  onGo: () => void
}) {
  return (
    <div className={styles.box}>
      <p className={styles.text}>
        💡 {getRoundDisplayName(activeRound)} está abierta para pronósticos
      </p>
      <Button variant="success" size="sm" onClick={onGo}>
        Ir a {getRoundDisplayNameByNumber(activeRound.round_number, rounds)} →
      </Button>
    </div>
  )
}
