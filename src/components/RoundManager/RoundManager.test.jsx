import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import RoundManager from './index'

let activeRound = null
let matchesMeta = []

vi.mock('../../contexts/TournamentContext', () => ({
  useTournament: () => ({ activeTournament: { id: 't1' } }),
}))

vi.mock('../../hooks/useRounds', () => ({
  useRounds: () => ({ rounds: [], activeRound, loading: false, error: null }),
}))

vi.mock('../../hooks/useMatchesMeta', () => ({
  useMatchesMeta: () => ({ matchesMeta, loading: false, error: null }),
}))

vi.mock('../../hooks/useRoundProgress', () => ({
  useRoundProgress: () => ({ progress: [], loading: false, error: null }),
}))

vi.mock('../../hooks/useMatches', () => ({
  useMatches: () => ({ matches: [], loading: false }),
}))

const CUARTOS = { id: 'r18', round_number: 18, name: 'Cuartos de Final' }
const partido = (id, is_finished) => ({ id, round_number: 18, is_finished, is_playoff: true })

describe('RoundManager', () => {
  beforeEach(() => {
    activeRound = null
    matchesMeta = []
  })

  it('sin fecha en juego muestra un aviso en vez de la tarjeta', () => {
    render(<RoundManager />)

    expect(screen.getByText('No hay una fecha en juego')).toBeInTheDocument()
  })

  it('con todos los partidos de la fecha terminados muestra el aviso', () => {
    activeRound = CUARTOS
    matchesMeta = ['a', 'b', 'c', 'd'].map(id => partido(id, true))
    render(<RoundManager />)

    expect(screen.getByText('No hay una fecha en juego')).toBeInTheDocument()
  })

  it('con un partido sin resultado la fecha sigue en juego', () => {
    activeRound = CUARTOS
    matchesMeta = [partido('a', true), partido('b', true), partido('c', true), partido('d', false)]
    render(<RoundManager />)

    expect(screen.getByText('Cuartos de Final')).toBeInTheDocument()
    expect(screen.queryByText('No hay una fecha en juego')).toBeNull()
  })
})
