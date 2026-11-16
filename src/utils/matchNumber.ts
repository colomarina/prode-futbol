import type { Match } from '../types/domain'

/**
 * Si el número de partido se le muestra al usuario.
 *
 * En una fecha regular `match_number` sigue el orden en que se juega y además
 * define el "partido de la fecha" (desempate). En un playoff es la posición en el
 * cuadro —define qué ganadores se cruzan en la ronda siguiente—, así que en una
 * lista ordenada por horario sale salteado (#4, #6, #3…) y no le dice nada a quien
 * lo lee. La llave muestra esa posición con el dibujo, no con el número.
 */
export const showsMatchNumber = (
  match: Pick<Match, 'is_playoff'> & { match_number: number | null }
): boolean => !match.is_playoff && Boolean(match.match_number)
