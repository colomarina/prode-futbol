import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'

/**
 * Todo lo que un diálogo tiene que hacer además de dibujarse: cerrar con Escape,
 * bloquear el scroll de atrás, atrapar el foco adentro y devolverlo al salir.
 *
 * Está como hook y no como componente `Modal` porque hoy la app tiene un solo
 * overlay (`TournamentDrawer`). Lo que se repetiría entre overlays es este
 * comportamiento, no el marco: un drawer entra desde el costado y un modal se
 * centra, así que comparten la conducta y no el layout.
 */

/**
 * Cuántos diálogos hay abiertos ahora mismo.
 *
 * Es un contador y no un booleano porque el cleanup de dos diálogos se pisa: el
 * que se cierra primero devolvía el scroll con el segundo todavía abierto. Con el
 * contador, el scroll vuelve cuando se cierra el último.
 */
let abiertos = 0
let overflowOriginal: string | null = null

const bloquearScroll = (): void => {
  if (abiertos === 0) {
    // Se guarda el valor que había en vez de asumir uno. El código anterior
    // restauraba `'unset'` a ciegas, así que si el body tenía un overflow propio
    // se lo comía.
    overflowOriginal = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  abiertos += 1
}

const liberarScroll = (): void => {
  abiertos = Math.max(0, abiertos - 1)
  if (abiertos === 0) {
    document.body.style.overflow = overflowOriginal ?? ''
    overflowOriginal = null
  }
}

/** Los elementos que pueden recibir foco, en orden de tabulación. */
const FOCUSABLES = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/**
 * Si el elemento está escondido, no tiene que participar del ciclo del Tab.
 *
 * Se mira el estilo computado y no `offsetWidth`: las medidas dependen del motor
 * de layout, así que en un entorno sin layout —jsdom, o sea los tests— daban 0
 * para todo y el filtro se llevaba puestos a los elementos visibles. Con dos
 * botones reales el ciclo quedaba con uno solo y el Tab no rotaba.
 */
const esVisible = (nodo: HTMLElement): boolean => {
  if (nodo.hidden || nodo.getAttribute('aria-hidden') === 'true') return false

  const estilo = getComputedStyle(nodo)
  return estilo.display !== 'none' && estilo.visibility !== 'hidden'
}

const focusablesDe = (contenedor: HTMLElement): HTMLElement[] =>
  [...contenedor.querySelectorAll<HTMLElement>(FOCUSABLES)].filter(esVisible)

/**
 * @returns El ref que va en el nodo con `role="dialog"`.
 */
export function useDialogBehavior(
  isOpen: boolean,
  onClose: () => void
): { contenedorRef: RefObject<HTMLDivElement | null> } {
  const contenedorRef = useRef<HTMLDivElement | null>(null)
  // Los dos tipos que pueden tener el foco y saben devolverlo: `focus()` viene de
  // `HTMLOrSVGElement`, que implementan tanto HTMLElement como SVGElement.
  const focoAnteriorRef = useRef<HTMLElement | SVGElement | null>(null)

  useEffect(() => {
    if (!isOpen) return

    // De dónde vino el foco, para devolverlo al cerrar. Sin esto, quien abre el
    // menú con teclado queda al principio de la página cuando lo cierra.
    const activo = document.activeElement
    focoAnteriorRef.current =
      activo instanceof HTMLElement || activo instanceof SVGElement ? activo : null
    bloquearScroll()

    const contenedor = contenedorRef.current
    // El primer foco va al contenedor y no al primer botón: así el lector de
    // pantalla anuncia el título del diálogo antes de nombrar un control.
    if (contenedor) {
      contenedor.setAttribute('tabindex', '-1')
      contenedor.focus()
    }

    const alPresionarTecla = (evento: KeyboardEvent): void => {
      if (evento.key === 'Escape') {
        onClose()
        return
      }

      if (evento.key !== 'Tab' || !contenedor) return

      const focusables = focusablesDe(contenedor)
      if (focusables.length === 0) {
        // Sin nada que enfocar, el Tab se iría al fondo de la página.
        evento.preventDefault()
        return
      }

      const primero = focusables[0]
      const ultimo = focusables[focusables.length - 1]

      // El ciclo se cierra a mano en los dos extremos: es lo que evita que el
      // Tab se escape a la página que quedó atrás del diálogo.
      if (evento.shiftKey && document.activeElement === primero) {
        evento.preventDefault()
        ultimo.focus()
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault()
        primero.focus()
      }
    }

    document.addEventListener('keydown', alPresionarTecla)

    return () => {
      document.removeEventListener('keydown', alPresionarTecla)
      liberarScroll()
      focoAnteriorRef.current?.focus()
    }
  }, [isOpen, onClose])

  return { contenedorRef }
}

/** Solo para los tests: el contador es estado de módulo. */
export const __dialogosAbiertos = (): number => abiertos
