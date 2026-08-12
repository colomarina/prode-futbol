import { describe, it, expect, vi } from 'vitest'
import { createSupabaseMock } from '../test/supabaseMock'

let mock

vi.mock('../lib/supabase', () => ({
  get supabase() {
    return mock.supabase
  },
}))

const perfil = (id, nombre) => ({ id, username: id, full_name: nombre, avatar_url: null })

const ROUND_SCORES = [
  { user_id: 'u-ana', total_points: 10, round_number: 1, profiles: perfil('u-ana', 'Ana Gomez') },
  { user_id: 'u-ana', total_points: 5, round_number: 2, profiles: perfil('u-ana', 'Ana Gomez') },
  { user_id: 'u-zoe', total_points: 20, round_number: 1, profiles: perfil('u-zoe', 'Zoe Diaz') },
  {
    user_id: 'u-leo',
    total_points: 99,
    round_number: 1,
    profiles: perfil('u-leo', 'Leo Sanchez'),
  },
]

const setup = (overrides = {}, rpcResults = {}) => {
  mock = createSupabaseMock(
    {
      rounds: { data: [{ round_number: 1 }, { round_number: 2 }], error: null },
      round_scores: { data: ROUND_SCORES, error: null },
      matches: { data: [], error: null },
      general_leaderboard: { data: [], error: null },
      ...overrides,
    },
    rpcResults
  )
}

const importFresh = async () => {
  vi.resetModules()
  return import('./useLeaderboard')
}

describe('fetchLeaderboardData', () => {
  it('suma los puntos de todas las fechas en la tabla general', async () => {
    setup()
    const { fetchLeaderboardData } = await importFresh()

    const tabla = await fetchLeaderboardData({
      roundNumber: null,
      tournamentId: 't1',
      isWorldCupTournament: false,
    })

    // Leo Sanchez esta en la lista de ocultos y no tiene que aparecer.
    expect(tabla.map(entry => entry.id)).toEqual(['u-zoe', 'u-ana'])
    expect(tabla.find(entry => entry.id === 'u-ana').total_points).toBe(15)
    expect(tabla.find(entry => entry.id === 'u-ana').rounds_played).toBe(2)
  })

  it('nunca consulta round_scores sin filtrar por torneo', async () => {
    // Regresión: existía un fallback que ante un error repetía la query sin
    // tournament_id, y como los round_number se repiten entre torneos eso
    // mezclaba los puntos en silencio.
    setup()
    const { fetchLeaderboardData } = await importFresh()

    await fetchLeaderboardData({
      roundNumber: null,
      tournamentId: 't1',
      isWorldCupTournament: false,
    })

    expect(mock.everyQueryFilteredBy('round_scores', 'tournament_id')).toBe(true)
  })

  it('propaga el error en vez de reintentar sin scope', async () => {
    setup({ round_scores: { data: null, error: { message: 'permission denied' } } })
    const { fetchLeaderboardData } = await importFresh()

    await expect(
      fetchLeaderboardData({ roundNumber: null, tournamentId: 't1', isWorldCupTournament: false })
    ).rejects.toMatchObject({ message: 'permission denied' })

    // Una sola consulta: no hubo segundo intento sin filtro.
    expect(mock.queriesTo('round_scores')).toHaveLength(1)
  })

  it('devuelve vacio si la fecha pedida no es de este torneo', async () => {
    setup()
    const { fetchLeaderboardData } = await importFresh()

    const tabla = await fetchLeaderboardData({
      roundNumber: 99,
      tournamentId: 't1',
      isWorldCupTournament: false,
    })

    expect(tabla).toEqual([])
    expect(mock.callsTo('round_scores')).toBe(0)
  })

  it('devuelve vacio si el torneo no tiene fechas', async () => {
    setup({ rounds: { data: [], error: null } })
    const { fetchLeaderboardData } = await importFresh()

    const tabla = await fetchLeaderboardData({
      roundNumber: null,
      tournamentId: 't1',
      isWorldCupTournament: false,
    })

    expect(tabla).toEqual([])
  })

  it('usa la RPC con bonus cuando corresponde', async () => {
    setup(
      {},
      { get_tournament_leaderboard_with_bonus: { data: [perfil('u-ana', 'Ana')], error: null } }
    )
    const { fetchLeaderboardData } = await importFresh()

    const tabla = await fetchLeaderboardData({
      roundNumber: null,
      tournamentId: 't1',
      isWorldCupTournament: true,
    })

    expect(mock.supabase.rpc).toHaveBeenCalledWith('get_tournament_leaderboard_with_bonus', {
      p_tournament_id: 't1',
    })
    expect(tabla).toHaveLength(1)
  })

  it('en el Mundial la tabla de playoffs excluye las fechas con tabla propia', async () => {
    setup({
      // En el Mundial 16avos (4) y octavos (5) tienen tabla aparte.
      matches: { data: [{ round_number: 4 }, { round_number: 5 }], error: null },
    })
    const { fetchLeaderboardData } = await importFresh()

    const tabla = await fetchLeaderboardData({
      roundNumber: 'playoffs',
      tournamentId: 't1',
      isWorldCupTournament: true,
    })

    expect(tabla).toEqual([])
    expect(mock.callsTo('round_scores')).toBe(0)
  })

  it('en una liga ninguna fecha de playoff queda afuera de la tabla de playoffs', async () => {
    // Regresión: la exclusión de las fechas 4 y 5 era incondicional, así que una
    // liga con playoffs en esas fechas perdía esos puntos en silencio.
    setup({
      matches: { data: [{ round_number: 4 }, { round_number: 5 }], error: null },
      rounds: { data: [{ round_number: 4 }, { round_number: 5 }], error: null },
      round_scores: {
        data: [
          { user_id: 'u-ana', total_points: 7, profiles: perfil('u-ana', 'Ana Gomez') },
          { user_id: 'u-zoe', total_points: 3, profiles: perfil('u-zoe', 'Zoe Diaz') },
        ],
        error: null,
      },
    })
    const { fetchLeaderboardData } = await importFresh()

    const tabla = await fetchLeaderboardData({
      roundNumber: 'playoffs',
      tournamentId: 't1',
      isWorldCupTournament: false,
    })

    expect(tabla.map(entry => entry.id)).toEqual(['u-ana', 'u-zoe'])
    expect(mock.callsTo('round_scores')).toBe(1)
  })
})
