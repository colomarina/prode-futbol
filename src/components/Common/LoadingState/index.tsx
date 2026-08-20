import type { CSSProperties } from 'react'
import Spinner from '../Spinner'

/**
 * Spinner + "Cargando...", la pantalla de espera de toda la app.
 *
 * Los tamaños van con nombre y no con píxeles sueltos. Antes cada pantalla
 * elegía los suyos —había spinners de 16, 20, 24, 48 y 56px, con bordes de 2.5,
 * 3 y 4— y el resultado era que dos pantallas que cargan lo mismo se veían
 * distinto. Los cuatro pasos de acá salen de agrupar esos valores reales.
 *
 * `style` queda como escape hatch para el `padding` del contenedor, que sí
 * depende de dónde se monta (una pantalla entera pide aire; un dropdown, no).
 *
 */

/** Los cuatro tamanios, que salen de agrupar los valores que habia sueltos. */
export type LoadingSize = 'xs' | 'sm' | 'md' | 'lg'

interface LoadingStateProps {
  message?: string
  size?: LoadingSize
  color?: string
  style?: CSSProperties
}

interface SizeConfig {
  spinner: number
  border: number
  spacing: string
  fontSize: string
}

const SIZES: Record<LoadingSize, SizeConfig> = {
  xs: { spinner: 16, border: 2, spacing: '8px', fontSize: 'var(--font-size-md)' },
  sm: { spinner: 24, border: 3, spacing: '10px', fontSize: 'var(--font-size-md)' },
  md: { spinner: 48, border: 4, spacing: '16px', fontSize: 'var(--font-size-base)' },
  lg: { spinner: 56, border: 4, spacing: '20px', fontSize: 'var(--font-size-base)' },
}

export default function LoadingState({
  message = 'Cargando...',
  size = 'lg',
  color,
  style,
}: LoadingStateProps) {
  const config = SIZES[size] ?? SIZES.lg

  return (
    <div style={{ textAlign: 'center', padding: 'var(--space-3xl) var(--space-lg)', ...style }}>
      <div style={{ margin: `0 auto ${config.spacing}`, width: 'fit-content' }}>
        <Spinner size={config.spinner} borderWidth={config.border} color={color} />
      </div>
      <p
        style={{
          margin: 0,
          color: 'var(--color-text-secondary)',
          fontSize: config.fontSize,
          fontWeight: '500',
        }}
      >
        {message}
      </p>
    </div>
  )
}
