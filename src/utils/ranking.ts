/**
 * Ordenamiento de tablas de posiciones. Fuente única: si dos pantallas ordenan
 * a los mismos empatados con criterios distintos, muestran posiciones distintas
 * para el mismo jugador.
 *
 * El desempate por id de usuario no es un criterio deportivo — los desempates
 * reales del prode están en `InfoPage/info.config.jsx` y se resuelven a mano.
 * Acá sólo hace falta que el orden sea **determinista**: sin desempate, el
 * resultado depende del orden en que Postgres devolvió las filas, que puede
 * variar entre consultas.
 *
 * Los dos parámetros son getters y no nombres de campo porque cada pantalla trae
 * la fila con una forma distinta (`total_points`, `points`, un acumulado propio).
 */
export const compareByPoints =
  <T>(
    getPoints: (entry: T) => number | string | null | undefined,
    getId: (entry: T) => string | number
  ) =>
  (a: T, b: T): number =>
    Number(getPoints(b) || 0) - Number(getPoints(a) || 0) ||
    String(getId(a)).localeCompare(String(getId(b)))

/**
 * Agrega `position` 1-based respetando el orden que ya trae el array.
 * Los empatados reciben posiciones distintas y consecutivas, que es lo que la
 * UI viene mostrando.
 */
export const assignPositions = <T extends object>(
  entries: T[] | null | undefined
): (T & { position: number })[] =>
  (entries || []).map((entry, index) => ({ ...entry, position: index + 1 }))
