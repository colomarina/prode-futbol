import { tint } from '../../../utils/tint'

/**
 * La tarjeta de cada sección de Reglas.
 *
 * Recibe un solo color y de ahí saca el borde y el fondo. Antes eran dos props
 * (`borderColor` y `backgroundColor`) y las tres secciones pasaban lo mismo: el
 * token en el borde y su tinte al 5% en el fondo, pero el tinte escrito a mano
 * como `rgba(30, 127, 67, 0.05)`, o sea el verde literal en vez de la variable.
 *
 * @param {string} color - Un token, tipo `var(--color-primary)`.
 */
const Card = ({ color, children }) => {
  return (
    <div
      className="card"
      style={{
        marginBottom: 'var(--space-xl)',
        backgroundColor: tint(color, 5),
        border: `2px solid ${color}`,
        padding: 'var(--space-lg)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      {children}
    </div>
  )
}

export default Card
