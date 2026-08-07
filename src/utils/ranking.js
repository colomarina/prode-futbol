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
 * @param {(entry: any) => number|string} getPoints
 * @param {(entry: any) => string|number} getId
 * @returns {(a: any, b: any) => number} comparador para Array.prototype.sort
 */
export const compareByPoints = (getPoints, getId) => (a, b) =>
  Number(getPoints(b) || 0) - Number(getPoints(a) || 0) ||
  String(getId(a)).localeCompare(String(getId(b)))

/**
 * Agrega `position` 1-based respetando el orden que ya trae el array.
 * Los empatados reciben posiciones distintas y consecutivas, que es lo que la
 * UI viene mostrando.
 *
 * @template T
 * @param {T[]} entries
 * @returns {(T & { position: number })[]}
 */
export const assignPositions = entries =>
  (entries || []).map((entry, index) => ({ ...entry, position: index + 1 }))
