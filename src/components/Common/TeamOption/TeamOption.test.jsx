import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import TeamOption from './index'

describe('TeamOption', () => {
  it('muestra el nombre y la bandera', () => {
    render(<TeamOption team={{ name: 'Argentina', logo_url: 'https://ejemplo/ar.png' }} />)

    expect(screen.getByText('Argentina')).toBeInTheDocument()
    const img = document.querySelector('img')
    expect(img).toHaveAttribute('src', 'https://ejemplo/ar.png')
  })

  it('la bandera es decorativa: el nombre ya está al lado', () => {
    // `alt=""` a propósito. Con un alt con el nombre del país, el lector de
    // pantalla lo diría dos veces.
    render(<TeamOption team={{ name: 'Brasil', logo_url: 'https://ejemplo/br.png' }} />)
    expect(document.querySelector('img')).toHaveAttribute('alt', '')
  })

  it('trae dimensiones y lazy, para no mover el layout al cargar', () => {
    render(<TeamOption team={{ name: 'Chile', logo_url: 'https://ejemplo/cl.png' }} />)
    const img = document.querySelector('img')

    expect(img).toHaveAttribute('width', '20')
    expect(img).toHaveAttribute('height', '14')
    expect(img).toHaveAttribute('loading', 'lazy')
  })

  it('sin bandera muestra un emoji en su lugar', () => {
    render(<TeamOption team={{ name: 'Sin escudo' }} />)

    expect(document.querySelector('img')).toBeNull()
    expect(screen.getByText('🏳️')).toBeInTheDocument()
  })

  it('el logo del equipo tiene prioridad sobre la bandera por slug', () => {
    render(<TeamOption team={{ name: 'Argentina', slug: 'argentina', logo_url: 'propio.png' }} />)
    expect(document.querySelector('img')).toHaveAttribute('src', 'propio.png')
  })
})
