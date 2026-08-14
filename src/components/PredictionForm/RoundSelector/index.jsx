import SelectDropdown from '../../Common/SelectDropdown'
import { getRoundDisplayName } from '../../../utils/roundLabels'
import styles from './RoundSelector.module.css'

/**
 * El selector de fecha del formulario de pronósticos.
 *
 * Existe porque la misma configuración de `SelectDropdown` —siete props, dos
 * `render*`— estaba escrita dos veces en `PredictionForm`: una en la pantalla
 * normal y otra en la de "esta fecha no tiene partidos".
 *
 * La tarjeta que lo envuelve queda del lado del que lo usa: las dos pantallas la
 * espacian distinto y unificarlas sería un cambio visual, no un refactor.
 */
export default function RoundSelector({ rounds, selectedRound, onSelect }) {
  return (
    <SelectDropdown
      label="📅 Seleccioná una Fecha"
      items={rounds}
      selectedId={selectedRound}
      onSelect={onSelect}
      valueKey="round_number"
      placeholder="Seleccionar fecha..."
      renderButton={round => <span className={styles.value}>{getRoundDisplayName(round)}</span>}
      renderOption={round => <span className={styles.option}>{getRoundDisplayName(round)}</span>}
    />
  )
}
