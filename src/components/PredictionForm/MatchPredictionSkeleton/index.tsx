import Skeleton from '../../Common/Skeleton'
import cardStyles from '../MatchPrediction/MatchPrediction.module.css'

/**
 * Las tarjetas de pronostico mientras cargan los partidos de la fecha.
 *
 * Antes, con `matchesLoading`, la pantalla entera era un spinner: no se veia ni el
 * selector de fecha, aunque las fechas ya habian llegado y no dependen de esta
 * consulta. Al llegar los partidos aparecian de golpe el selector, el resumen y
 * las tarjetas.
 *
 * ## Que coincide y que no
 *
 * El marco de la tarjeta coincide **exacto**, porque se reusa la clase `.card` de
 * `MatchPrediction`: mismo padding, borde, radio, sombra y degradado. Eso es lo
 * que mas se ve.
 *
 * El alto **no** coincide exacto, y no puede: la tarjeta real cambia de alto segun
 * si el partido tiene aviso de cerrado, si es de playoff y muestra el selector de
 * penales, o si el pronostico ya esta cargado. El esqueleto reproduce la variante
 * mas simple —encabezado y marcador—, asi que en una fecha con avisos queda mas
 * corto que el contenido final. Sigue siendo mejor que un spinner de una linea,
 * pero no es cero salto y conviene no decir que lo es.
 *
 * `CANTIDAD = 4` es el tamanio tipico de una fecha del prode.
 */
const CANTIDAD = 4

/**
 * El alto de la cajita del marcador. Sale de sumar los valores de `.box` en
 * `ScoreInput.module.css` —`font-size: 1.5rem`, `padding: var(--space-sm)` arriba
 * y abajo, `border: 3px`— en vez de elegir un numero: si esa cajita cambia, esto
 * queda desalineado y el comentario dice donde mirar.
 */
const ALTO_DEL_MARCADOR = 'calc(1.5rem * 1.2 + var(--space-sm) * 2 + 6px)'

export default function MatchPredictionSkeleton() {
  return (
    /*
     * `role="status"` en el contenedor porque los `Skeleton` son `aria-hidden`:
     * sin esto la pantalla queda muda durante la carga, y el spinner que habia
     * antes traia su `role="status"` y su mensaje incluidos.
     */
    <div
      role="status"
      aria-live="polite"
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2xl)' }}
    >
      <span
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
        }}
      >
        Cargando los partidos de la fecha...
      </span>

      {Array.from({ length: CANTIDAD }, (_, indice) => (
        <div key={indice} className={cardStyles.card}>
          {/* El bloque de fecha y hora: los mismos margenes que `.meta` de
              `MatchHeader`, incluido el `margin-top: 36px` que deja pasar por
              debajo de los badges absolutos. */}
          <div style={{ marginTop: '36px', marginBottom: 'var(--space-lg)', textAlign: 'center' }}>
            <Skeleton height="1.1rem" width="60%" style={{ marginInline: 'auto' }} />
          </div>

          {/* La misma grilla de 5 columnas que el marcador real. */}
          <div className={cardStyles.scoreboard}>
            <div className={cardStyles.homeTeam}>
              <Skeleton height="24px" width="24px" circle style={{ marginInline: 'auto' }} />
              <Skeleton
                height="0.9rem"
                width="60px"
                style={{ marginTop: 'var(--space-xs)', marginInline: 'auto' }}
              />
            </div>
            <Skeleton height={ALTO_DEL_MARCADOR} width="50px" />
            <Skeleton height="1rem" width="12px" />
            <Skeleton height={ALTO_DEL_MARCADOR} width="50px" />
            <div className={cardStyles.awayTeam}>
              <Skeleton height="24px" width="24px" circle style={{ marginInline: 'auto' }} />
              <Skeleton
                height="0.9rem"
                width="60px"
                style={{ marginTop: 'var(--space-xs)', marginInline: 'auto' }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
