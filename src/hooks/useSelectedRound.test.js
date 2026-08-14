import { describe, it, expect } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useSelectedRound } from './useSelectedRound'

const ronda = numero => ({ round_number: numero })
const ROUNDS = [ronda(1), ronda(2), ronda(3)]

describe('useSelectedRound', () => {
  it('elige la fecha activa cuando las fechas terminaron de cargar', () => {
    const { result } = renderHook(() =>
      useSelectedRound({ tournamentId: 't1', rounds: ROUNDS, activeRound: ronda(2) })
    )

    expect(result.current.selectedRound).toBe(2)
  })

  it('no elige nada mientras las fechas todavía cargan', () => {
    // El bug: `rounds` resuelve antes que los partidos, así que `activeRound` es
    // null un instante. Sin este guard el fallback elegía la fecha 3 —la más alta
    // del torneo—, pedía sus partidos y sus pronósticos, y recién después saltaba
    // a la correcta.
    const { result } = renderHook(() =>
      useSelectedRound({ tournamentId: 't1', rounds: ROUNDS, activeRound: null, loading: true })
    )

    expect(result.current.selectedRound).toBeNull()
  })

  it('al terminar la carga salta a la activa, sin pasar por la última', () => {
    const { result, rerender } = renderHook(props => useSelectedRound(props), {
      initialProps: { tournamentId: 't1', rounds: ROUNDS, activeRound: null, loading: true },
    })

    expect(result.current.selectedRound).toBeNull()

    rerender({ tournamentId: 't1', rounds: ROUNDS, activeRound: ronda(2), loading: false })

    expect(result.current.selectedRound).toBe(2)
  })

  it('sin fecha activa cae a la más alta: es el torneo ya jugado entero', () => {
    const { result } = renderHook(() =>
      useSelectedRound({ tournamentId: 't1', rounds: ROUNDS, activeRound: null })
    )

    expect(result.current.selectedRound).toBe(3)
  })

  it('la selección manual le gana a la fecha activa', () => {
    const { result } = renderHook(() =>
      useSelectedRound({ tournamentId: 't1', rounds: ROUNDS, activeRound: ronda(2) })
    )

    act(() => result.current.selectRound(1))

    expect(result.current.selectedRound).toBe(1)
  })

  it('la selección manual sobrevive a un re-render con la fecha activa presente', () => {
    const { result, rerender } = renderHook(props => useSelectedRound(props), {
      initialProps: { tournamentId: 't1', rounds: ROUNDS, activeRound: ronda(2), loading: false },
    })

    act(() => result.current.selectRound(1))
    rerender({ tournamentId: 't1', rounds: ROUNDS, activeRound: ronda(2), loading: false })

    expect(result.current.selectedRound).toBe(1)
  })

  it('cambiar de torneo borra la selección y vuelve a auto-elegir', () => {
    // Los round_number se repiten entre torneos: conservar el 1 elegido a mano
    // mostraría la fecha 1 del torneo nuevo como si el usuario la hubiera pedido.
    const { result, rerender } = renderHook(props => useSelectedRound(props), {
      initialProps: { tournamentId: 't1', rounds: ROUNDS, activeRound: ronda(2), loading: false },
    })

    act(() => result.current.selectRound(1))

    rerender({ tournamentId: 't2', rounds: ROUNDS, activeRound: ronda(3), loading: false })

    expect(result.current.selectedRound).toBe(3)
  })

  it('volver a la fecha activa vuelve a seguirla', () => {
    // El atajo "Ir a la fecha abierta" no es una elección manual más: si mientras
    // la pantalla está abierta se abre la fecha siguiente, el usuario la sigue.
    const { result, rerender } = renderHook(props => useSelectedRound(props), {
      initialProps: { tournamentId: 't1', rounds: ROUNDS, activeRound: ronda(2), loading: false },
    })

    act(() => result.current.selectRound(1))
    act(() => result.current.followActiveRound())

    expect(result.current.selectedRound).toBe(2)

    rerender({ tournamentId: 't1', rounds: ROUNDS, activeRound: ronda(3), loading: false })

    expect(result.current.selectedRound).toBe(3)
  })

  it('sin fecha activa el atajo no toca la selección', () => {
    const { result } = renderHook(() =>
      useSelectedRound({ tournamentId: 't1', rounds: ROUNDS, activeRound: null })
    )

    act(() => result.current.selectRound(1))
    act(() => result.current.followActiveRound())

    expect(result.current.selectedRound).toBe(1)
  })

  it('sin fechas no elige nada', () => {
    const { result } = renderHook(() =>
      useSelectedRound({ tournamentId: 't1', rounds: [], activeRound: null })
    )

    expect(result.current.selectedRound).toBeNull()
  })

  it('ordena las fechas de la más nueva a la más vieja', () => {
    const { result } = renderHook(() =>
      useSelectedRound({ tournamentId: 't1', rounds: ROUNDS, activeRound: null })
    )

    expect(result.current.availableRounds.map(r => r.round_number)).toEqual([3, 2, 1])
  })

  it('no muta el array de fechas que recibe', () => {
    const rounds = [ronda(1), ronda(2), ronda(3)]

    renderHook(() => useSelectedRound({ tournamentId: 't1', rounds, activeRound: null }))

    expect(rounds.map(r => r.round_number)).toEqual([1, 2, 3])
  })

  it('devuelve la misma referencia de fechas mientras el array no cambie', () => {
    // Un array nuevo por render vuelve loco a cualquier efecto que lo tenga como
    // dependencia; es el bug de /admin/horarios documentado en CLAUDE.md.
    const props = { tournamentId: 't1', rounds: ROUNDS, activeRound: ronda(2), loading: false }
    const { result, rerender } = renderHook(p => useSelectedRound(p), { initialProps: props })

    const primera = result.current.availableRounds
    rerender(props)

    expect(result.current.availableRounds).toBe(primera)
  })
})
