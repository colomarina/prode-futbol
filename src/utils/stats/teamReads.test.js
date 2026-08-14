import { describe, it, expect } from 'vitest'
import { buildTeamStats, MIN_TEAM_PREDICTIONS } from './teamReads'

const BOCA = { id: 1, name: 'Boca' }
const RIVER = { id: 2, name: 'River' }
const TIGRE = { id: 3, name: 'Tigre' }

/**
 * @param home equipo local
 * @param away equipo visitante
 * @param pred [golesLocal, golesVisitante] pronosticados
 * @param points lo que Supabase le asignó al pronóstico
 */
const entrada = (home, away, pred, points) => ({
  match: { home_score: 1, away_score: 1, home_team: home, away_team: away },
  prediction: { home_prediction: pred[0], away_prediction: pred[1], points },
})

describe('buildTeamStats', () => {
  it('el favorito es a quien más veces elige como ganador', () => {
    const { favoriteTeam } = buildTeamStats([
      entrada(BOCA, RIVER, [2, 0], 0),
      entrada(BOCA, TIGRE, [1, 0], 0),
      entrada(RIVER, TIGRE, [2, 1], 0),
    ])
    expect(favoriteTeam).toEqual({ name: 'Boca', count: 2 })
  })

  it('los empates pronosticados no le cuentan a nadie como favorito', () => {
    const { favoriteTeam } = buildTeamStats([entrada(BOCA, RIVER, [1, 1], 0)])
    expect(favoriteTeam.count).toBe(0)
  })

  it('sin partidos no hay favorito ni lecturas', () => {
    expect(buildTeamStats([])).toEqual({
      favoriteTeam: null,
      bestReadTeam: null,
      worstReadTeam: null,
    })
  })

  it('el mejor y el peor leído se miden por proporción de partidos con puntos', () => {
    // Boca: 3 partidos, suma en 3. Tigre: 3 partidos, suma en 1.
    const { bestReadTeam, worstReadTeam } = buildTeamStats([
      entrada(BOCA, RIVER, [1, 0], 3),
      entrada(BOCA, RIVER, [1, 0], 3),
      entrada(BOCA, RIVER, [1, 0], 3),
      entrada(TIGRE, RIVER, [1, 0], 3),
      entrada(TIGRE, RIVER, [1, 0], 0),
      entrada(TIGRE, RIVER, [1, 0], 0),
    ])
    expect(bestReadTeam).toEqual({ name: 'Boca', percentage: 100, matches: 3 })
    expect(worstReadTeam).toEqual({ name: 'Tigre', percentage: 33.3, matches: 3 })
  })

  it('exige un mínimo de partidos, pero si nadie llega muestra lo que haya', () => {
    expect(MIN_TEAM_PREDICTIONS).toBe(3)

    // Boca llega al mínimo con 50%; Tigre tiene un solo partido al 100%. Con el
    // filtro puesto, Tigre no compite: un 100% de un partido no dice nada.
    const conMinimo = buildTeamStats([
      entrada(BOCA, RIVER, [1, 0], 3),
      entrada(BOCA, RIVER, [1, 0], 3),
      entrada(BOCA, RIVER, [1, 0], 0),
      entrada(BOCA, RIVER, [1, 0], 0),
      entrada(TIGRE, { id: 9, name: 'Otro' }, [1, 0], 3),
    ])
    expect(conMinimo.bestReadTeam.name).toBe('Boca')

    // Si nadie llega al mínimo, se muestra igual: es mejor un dato flojo que un
    // guión, y el `matches` queda a la vista para dimensionarlo.
    const sinMinimo = buildTeamStats([entrada(BOCA, RIVER, [1, 0], 3)])
    expect(sinMinimo.bestReadTeam).toEqual({ name: 'Boca', percentage: 100, matches: 1 })
  })

  it('un equipo sin rival definido entra como favorito pero no como lectura', () => {
    // Playoff del Mundial: el partido existe con un solo equipo cargado. Ese
    // equipo suma en `predictedWinnerCount` pero su `matches` queda en 0, así que
    // no puede dividir para sacar un porcentaje.
    const { favoriteTeam, bestReadTeam, worstReadTeam } = buildTeamStats([
      entrada(BOCA, null, [2, 0], 5),
    ])
    expect(favoriteTeam).toEqual({ name: 'Boca', count: 1 })
    expect(bestReadTeam).toBeNull()
    expect(worstReadTeam).toBeNull()
  })
})
