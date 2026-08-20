import type { CSSProperties } from 'react'
import type { TeamSummary } from '../../../types/domain'

/** Los cuatro tamanios del escudo. */
export type TeamDisplaySize = 'sm' | 'md' | 'lg' | 'xl'

interface TeamDisplayProps {
  /** `null` cuando el cruce de playoff todavia no tiene equipos: muestra un guion. */
  team?: TeamSummary | null
  size?: TeamDisplaySize
  /** El nombre debajo del escudo, en vez de al costado. */
  showNameBelow?: boolean
}

/**
 * El escudo va con `alt=""` a proposito: las dos ramas renderizan el nombre del
 * equipo al lado (o debajo), asi que un `alt` con el nombre lo hace anunciar dos
 * veces. Con el texto ahi, el escudo es decorativo.
 *
 * `loading="lazy"` si suma: este componente se repite en cada fila de cada tabla.
 * Atributos `width`/`height` no hacen falta: `sizes[size]` fija las dos
 * dimensiones por CSS, asi que el espacio ya queda reservado y el escudo que
 * carga no corre el layout.
 */
export default function TeamDisplay({
  team,
  size = 'md',
  showNameBelow = false,
}: TeamDisplayProps) {
  const sizes: Record<TeamDisplaySize, CSSProperties> = {
    sm: { width: '24px', height: '24px' },
    md: { width: '32px', height: '32px' },
    lg: { width: '48px', height: '48px' },
    xl: { width: '64px', height: '64px' },
  }

  const textSizes: Record<TeamDisplaySize, string> = {
    sm: '0.75rem',
    md: '0.875rem',
    lg: '1rem',
    xl: '1.125rem',
  }

  if (!team) return <span style={{ color: 'var(--color-text-secondary)' }}>-</span>

  if (showNameBelow) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-xs)',
        }}
      >
        {team.logo_url && (
          <img
            src={team.logo_url}
            alt=""
            loading="lazy"
            style={{
              ...sizes[size],
              objectFit: 'contain',
            }}
            onError={e => {
              // Si el escudo no carga, se esconde y queda solo el nombre.
              e.currentTarget.style.display = 'none'
            }}
          />
        )}
        <span
          style={{
            fontSize: textSizes[size],
            fontWeight: '600',
            textAlign: 'center',
            lineHeight: '1.2',
            maxWidth: '80px',
          }}
        >
          {team.name}
        </span>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-sm)',
      }}
    >
      {team.logo_url && (
        <img
          src={team.logo_url}
          alt=""
          loading="lazy"
          style={{
            ...sizes[size],
            objectFit: 'contain',
          }}
          onError={e => {
            // Fallback si la imagen no carga
            e.currentTarget.style.display = 'none'
          }}
        />
      )}
      <span
        style={{
          fontSize: textSizes[size],
          fontWeight: '600',
        }}
      >
        {team.name}
      </span>
    </div>
  )
}
