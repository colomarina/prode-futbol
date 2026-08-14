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
 * @returns {{ type: 'loading', message: string } | { type: 'empty', title: string, description: string } | null}
 */
export const getFormPlaceholder = ({ roundsLoading, rounds, matchesLoading, selectedRound }) => {
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

  if (matchesLoading) {
    return { type: 'loading', message: 'Cargando partidos...' }
  }

  // Las fechas ya están pero la auto-selección todavía no corrió su efecto.
  if (!selectedRound) {
    return { type: 'loading', message: 'Preparando información...' }
  }

  return null
}
