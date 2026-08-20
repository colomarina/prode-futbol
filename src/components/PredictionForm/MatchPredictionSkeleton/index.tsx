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
 * **Cuantas tarjetas no se adivina**: lo dice `cantidad`, que sale de contar en
 * `useMatchesMeta` los partidos de la fecha elegida. Esa es la consulta compartida
 * de "todos los partidos del torneo": ya esta en cache y resuelve antes que la
 * consulta pesada, asi que el numero es exacto y no cuesta una peticion.
 *
 * Al principio esto era una constante en 4. Medido en el navegador contra una fecha
 * de 15 partidos, el documento pasaba de 1026 a 3610 px: el esqueleto reservaba una
 * cuarta parte del alto final. No movia nada de lo que el usuario estaba mirando
 * —el selector se queda quieto— pero reservar el alto es justamente para lo que
 * existe.
 *
 * El alto de **cada** tarjeta sigue siendo aproximado, y no puede no serlo: la
 * tarjeta real cambia de alto segun si el partido tiene aviso de cerrado, si es de
 * playoff y muestra el selector de penales, o si el pronostico ya esta cargado. El
 * esqueleto reproduce la variante mas simple, asi que en una fecha con avisos queda
 * corto.
 */

/** Cuando todavia no se sabe cuantos partidos tiene la fecha. */
const CANTIDAD_POR_DEFECTO = 4

/**
 * Los dos altos de adentro de la tarjeta, **medidos en el navegador** y no
 * calculados. El primer intento los derivaba de los tokens y los dos daban corto:
 *
 * - La cajita del marcador da 52.8px, no los 50.8 que sale de
 *   `1.5rem * 1.2 + var(--space-sm) * 2 + 6px`. El factor real no es 1.2: `.box`
 *   usa `line-height: normal`, que a 24px son ~30.8px en esta tipografia. Ningun
 *   token expresa eso.
 * - El bloque de fecha da 25.6px. La linea es `--font-size-md` con el line-height
 *   global de 1.6 (23.04px) y los emojis del texto —📅 y 🕐— estiran la caja un
 *   par de px mas.
 *
 * Si alguno de los dos componentes cambia de tamanio, esto queda desalineado: los
 * numeros salen de `ScoreInput.module.css` (`.box`) y de
 * `MatchHeader.module.css` (`.meta` / `.datetime`).
 */
const ALTO_DEL_MARCADOR = '52.8px'
const ALTO_DE_LA_FECHA = '25.6px'

export default function MatchPredictionSkeleton({ cantidad }: { cantidad?: number }) {
  // `0` es un valor legítimo de `matchesMeta` (una fecha sin partidos cargados), pero
  // no de acá: un esqueleto vacío no reserva nada. En ese caso la pantalla que
  // corresponde es la de "no hay partidos", no esta.
  const filas = cantidad && cantidad > 0 ? cantidad : CANTIDAD_POR_DEFECTO

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

      {Array.from({ length: filas }, (_, indice) => (
        <div key={indice} className={cardStyles.card}>
          {/* El bloque de fecha y hora: los mismos margenes que `.meta` de
              `MatchHeader`, incluido el `margin-top: 36px` que deja pasar por
              debajo de los badges absolutos. */}
          <div
            style={{
              marginTop: '36px',
              marginBottom: 'var(--space-lg)',
              height: ALTO_DE_LA_FECHA,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Skeleton height="1.1rem" width="60%" />
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
