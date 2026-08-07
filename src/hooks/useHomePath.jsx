import { useTournament } from '../contexts/TournamentContext'
import { getSectionPath } from '../components/Navigation/pages-with-sections.config'

/**
 * A dónde lleva la raíz de la app.
 *
 * En un torneo terminado se entra por la tabla de posiciones: el formulario de
 * pronósticos no tiene nada que ofrecer y la tabla final es lo que se viene a
 * ver. Lo usan tanto la ruta `/` como los guards que redirigen.
 */
export const useHomePath = () => {
  const { isReadOnly } = useTournament()
  return isReadOnly ? getSectionPath('leaderboard') : getSectionPath('predictions')
}
