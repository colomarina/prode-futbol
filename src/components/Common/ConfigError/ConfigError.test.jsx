import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ConfigError from './index'

describe('ConfigError', () => {
  it('lista las variables que faltan', () => {
    render(
      <ConfigError missingVars={['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY']} />
    )

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('VITE_SUPABASE_URL')).toBeInTheDocument()
    expect(screen.getByText('VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY')).toBeInTheDocument()
  })

  it('usa singular cuando falta una sola', () => {
    render(<ConfigError missingVars={['VITE_SUPABASE_URL']} />)

    expect(screen.getByText(/falta esta variable de entorno/)).toBeInTheDocument()
  })

  it('usa plural cuando faltan varias', () => {
    render(<ConfigError missingVars={['VITE_SUPABASE_URL', 'OTRA']} />)

    expect(screen.getByText(/faltan estas variables de entorno/)).toBeInTheDocument()
  })

  it('explica donde configurarlas', () => {
    render(<ConfigError missingVars={['VITE_SUPABASE_URL']} />)

    expect(screen.getByText(/\.env\.example/)).toBeInTheDocument()
    expect(screen.getByText(/Vercel/)).toBeInTheDocument()
  })
})
