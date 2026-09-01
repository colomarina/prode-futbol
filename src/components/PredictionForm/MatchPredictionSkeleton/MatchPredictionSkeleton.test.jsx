import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MatchPredictionSkeleton from './index'

/**
 * El punto de este componente es reservar el alto que va a ocupar el contenido, asi
 * que lo que hay que cubrir es que dibuje **tantas tarjetas como partidos** y que
 * anuncie la carga. Los altos se verificaron midiendo en el navegador; eso no se
 * puede testear en jsdom, que no hace layout.
 */
const tarjetas = contenedor => contenedor.querySelectorAll('[class*="card"]').length

describe('MatchPredictionSkeleton', () => {
  it('dibuja una tarjeta por partido de la fecha', () => {
    // Medido en el navegador: con la constante en 4 y una fecha de 15 partidos, el
    // documento pasaba de 1026 a 3610 px. La cantidad sale de `useMatchesMeta`.
    const { container } = render(<MatchPredictionSkeleton cantidad={15} />)

    expect(tarjetas(container)).toBe(15)
  })

  it('sin cantidad cae a un default en vez de no dibujar nada', () => {
    const { container } = render(<MatchPredictionSkeleton />)

    expect(tarjetas(container)).toBe(4)
  })

  it('un cero no deja el esqueleto vacio', () => {
    // `0` es un valor legitimo de `matchesMeta` —una fecha sin partidos cargados—,
    // pero un esqueleto sin tarjetas no reserva nada. Esa fecha tiene su propia
    // pantalla de "no hay partidos".
    const { container } = render(<MatchPredictionSkeleton cantidad={0} />)

    expect(tarjetas(container)).toBe(4)
  })

  it('anuncia la carga, porque los bloques son aria-hidden', () => {
    // Sin esto el cambio de spinner a esqueleto deja la pantalla muda: el spinner
    // traia su propio role="status" y su mensaje.
    render(<MatchPredictionSkeleton cantidad={2} />)

    const estado = screen.getByRole('status')
    expect(estado).toBeInTheDocument()
    expect(estado).toHaveTextContent('Cargando los partidos de la fecha...')
  })

  it('los bloques grises no se anuncian de a uno', () => {
    const { container } = render(<MatchPredictionSkeleton cantidad={2} />)

    const bloques = container.querySelectorAll('[class*="skeleton"]')
    expect(bloques.length).toBeGreaterThan(0)
    bloques.forEach(b => expect(b).toHaveAttribute('aria-hidden', 'true'))
  })
})
