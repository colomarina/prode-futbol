import { describe, it, expect } from 'vitest'
import { showsMatchNumber } from './matchNumber'

describe('showsMatchNumber', () => {
  it('muestra el número en un partido de fecha regular', () => {
    expect(showsMatchNumber({ is_playoff: false, match_number: 5 })).toBe(true)
  })

  it('lo oculta en un playoff, donde es la posición en el cuadro', () => {
    expect(showsMatchNumber({ is_playoff: true, match_number: 4 })).toBe(false)
  })

  it('lo oculta si el partido no tiene número', () => {
    expect(showsMatchNumber({ is_playoff: false, match_number: null })).toBe(false)
  })
})
