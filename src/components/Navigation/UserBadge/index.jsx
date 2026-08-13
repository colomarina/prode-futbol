import Badge from '../../Common/Badge'
import styles from './UserBadge.module.css'

/**
 * "Equipo: <nombre>", en el header.
 *
 * Los tintes eran del emerald de Tailwind con el texto en `--color-primary`: el
 * fondo no seguía al torneo y el nombre del equipo sí.
 */
export default function UserBadge({ username }) {
  return (
    <Badge tone="neutral" className={styles.badge}>
      <span className={styles.etiqueta}>Equipo:</span>
      <span className={styles.nombre}>{username}</span>
    </Badge>
  )
}
