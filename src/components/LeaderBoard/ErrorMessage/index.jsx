import { memo } from 'react'
import Button from '../../Common/Button'
import { tint } from '../../../utils/tint'

/**
 * El aviso de error de la tabla de posiciones.
 *
 * El botón tenía sus estilos inline y, además, el hover **en JavaScript**: dos
 * handlers `onMouseEnter`/`onMouseLeave` que escribían `style.opacity` a mano.
 * Eso no funciona con teclado ni con `:focus-visible`, así que quien llegara al
 * botón tabulando no veía ninguna respuesta. Ahora es `Button variant="danger"`,
 * que resuelve hover y foco en CSS.
 *
 * El fondo era `--color-error-light` sólido con el texto en `--color-error`: rojo
 * sobre rojo, 1.4:1 de contraste. Ahora es un tinte del error, como los demás
 * avisos de la app.
 */
const ErrorMessage = memo(function ErrorMessage({ error, onRetry }) {
  return (
    <div
      style={{
        padding: '24px',
        textAlign: 'center',
        backgroundColor: tint('var(--color-error)', 10),
        border: '1px solid var(--color-error)',
        borderRadius: '12px',
        color: 'var(--color-error-text)',
      }}
    >
      <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⚠️</div>
      <p style={{ marginBottom: '16px', fontWeight: '600' }}>{error || 'Ha ocurrido un error'}</p>
      {onRetry && (
        <Button variant="danger" size="sm" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  )
})

export default ErrorMessage
