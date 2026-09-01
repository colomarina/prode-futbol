import { describe, it, expect } from 'vitest'
import { tint } from './tint'

describe('tint', () => {
  it('mezcla el color con transparente', () => {
    expect(tint('var(--color-success)', 10)).toBe(
      'color-mix(in srgb, var(--color-success) 10%, transparent)'
    )
  })

  it('acepta una custom property, que es el punto', () => {
    // `rgba(var(--x), 0.1)` no es CSS válido: por eso los tintes estaban con el
    // color literal adentro y no seguían al tema.
    expect(tint('var(--color-error)', 20)).toContain('var(--color-error)')
  })

  it('sirve con cualquier color css', () => {
    expect(tint('#10b981', 5)).toBe('color-mix(in srgb, #10b981 5%, transparent)')
  })
})
