/**
 * Tinte de un color: el mismo color pero translúcido, para fondos y bordes suaves.
 *
 * Existe porque los tintes estaban escritos como `rgba()` con el color literal
 * adentro: `rgba(16, 185, 129, 0.1)` es el emerald de Tailwind, sin relación con
 * `--color-success` ni con la paleta del torneo. Un `rgba()` no puede tomar una
 * custom property como argumento, así que el color quedaba clavado a mano; con
 * `color-mix` sí se puede, y entonces el tinte acompaña al tema.
 *
 * @param color Un color CSS, típicamente `var(--color-success)`.
 * @param porcentaje Cuánto del color queda; el resto es transparente.
 */
export const tint = (color: string, porcentaje: number): string =>
  `color-mix(in srgb, ${color} ${porcentaje}%, transparent)`
