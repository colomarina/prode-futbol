import Skeleton from '../../Common/Skeleton'
import { TableHeader } from '../LeaderboardTable'
import { TABLE_COLUMNS } from '../leaderboard.config'
import type { LeaderboardSelection } from '../LeadboardHeader'

/**
 * La tabla de posiciones mientras carga.
 *
 * Reemplaza al spinner que ocupaba la pantalla entera. Antes, mientras cargaba, no
 * se veia ni el selector de fecha: `LeaderBoard` devolvia el `LoadingState` en vez
 * de todo su contenido, asi que al llegar los datos aparecian de golpe el header,
 * el selector y la tabla, y la pagina saltaba.
 *
 * Las medidas no son a ojo. Las columnas salen de `TABLE_COLUMNS`, el mismo mapa
 * que usa `LeaderboardTable`, asi que el skeleton tiene tantas columnas como la
 * tabla real; y el `padding` de cada celda es el mismo `var(--space-md)
 * var(--space-sm)` que usan `LeaderboardTable` y `LeaderboardRow`. Con eso el alto
 * de fila coincide y no hay salto.
 *
 * `FILAS = 10` es la unica cifra elegida: es el orden de magnitud de los torneos
 * del prode, y de mas o de menos solo cambia cuanto scroll se reserva.
 */
const FILAS = 10

/** El ancho del nombre varia por fila: todas iguales se lee como una grilla, no como una lista. */
const ANCHOS_DE_NOMBRE = ['70%', '55%', '80%', '60%', '75%', '50%', '68%', '58%', '72%', '62%']

const CELDA = { padding: 'var(--space-md) var(--space-sm)' }

export default function LeaderboardTableSkeleton({
  selectedRound,
}: {
  selectedRound?: LeaderboardSelection
}) {
  const columnas =
    selectedRound === 'playoffs'
      ? TABLE_COLUMNS.playoffs
      : TABLE_COLUMNS[selectedRound ? 'round' : 'general']

  return (
    /*
     * El `role="status"` va aca y no en cada bloque: los `Skeleton` son
     * `aria-hidden`, asi que sin esto la pantalla quedaba muda durante la carga
     * —el spinner que habia antes traia su propio `role="status"`—. El texto es
     * para el lector de pantalla, no se ve.
     */
    <div role="status" aria-live="polite" style={{ overflowX: 'auto' }}>
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
        Cargando la tabla de posiciones...
      </span>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        {/* El mismo encabezado que la tabla real, para que su fila no aparezca de
            golpe al llegar los datos. */}
        <TableHeader columns={columnas} />
        <tbody>
          {Array.from({ length: FILAS }, (_, fila) => (
            <tr key={fila} style={{ borderBottom: '1px solid var(--color-border)' }}>
              {columnas.map((columna, indice) => (
                <td key={columna || indice} style={CELDA}>
                  <Skeleton
                    height="1.25rem"
                    width={indice === 1 ? ANCHOS_DE_NOMBRE[fila] : '2rem'}
                    style={indice === 1 ? undefined : { marginInline: 'auto' }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
