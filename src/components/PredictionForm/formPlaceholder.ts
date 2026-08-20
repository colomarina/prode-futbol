/**
 * Qué pantalla mostrar antes del formulario, cuando todavía no hay nada que
 * pronosticar.
 *
 * Eran cuatro `return` tempranos casi idénticos —`<div className="container">` más
 * un `LoadingState` o un `EmptyState`—, y el orden entre ellos es la única cosa
 * que importa: se pregunta por las fechas antes que por los partidos, porque sin
 * fechas los partidos nunca van a llegar.
 *
 * El quinto caso (la fecha existe pero no tiene partidos) no está acá: ese sí
 * muestra el selector, para que el usuario pueda irse a otra fecha.
 *
 */
import type { Round } from '../../types/domain'

/**
 * Lo que muestra la pantalla mientras no hay nada que pronosticar.
 *
 * `skeleton` se distingue de `loading` porque no tapa la pantalla: cuando lo unico
 * que falta son los partidos, las fechas ya estan y el selector se puede mostrar,
 * asi que el esqueleto va donde van a ir las tarjetas y el resto de la pantalla
 * queda en su lugar. `loading` es el spinner de pantalla completa, para cuando
 * todavia no hay ni fechas y no hay nada que dibujar alrededor.
 */
export type FormPlaceholder =
  | { type: 'loading'; message: string }
  | { type: 'skeleton' }
  | { type: 'empty'; title: string; description: string }

export const getFormPlaceholder = ({
  roundsLoading,
  rounds,
  matchesLoading,
  selectedRound,
}: {
  roundsLoading?: boolean
  rounds?: Round[] | null
  matchesLoading?: boolean
  selectedRound?: number | null
}): FormPlaceholder | null => {
  if (roundsLoading) {
    return { type: 'loading', message: 'Cargando información...' }
  }

  if (!rounds || rounds.length === 0) {
    return {
      type: 'empty',
      title: 'No hay fechas disponibles',
      description: 'Esperá a que el administrador cree las fechas del torneo',
    }
  }

  // Las fechas ya llegaron, asi que el selector se puede dibujar: lo unico que
  // falta son las tarjetas de los partidos, y ese hueco lo llena el esqueleto.
  if (matchesLoading) {
    return { type: 'skeleton' }
  }

  // Las fechas ya están pero la auto-selección todavía no corrió su efecto.
  if (!selectedRound) {
    return { type: 'loading', message: 'Preparando información...' }
  }

  return null
}
