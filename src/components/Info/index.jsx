export default function Info() {
  return (
    <div className="container" style={{ maxWidth: '1000px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <h2
          style={{
            fontWeight: '700',
            color: 'var(--color-primary)',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: '2rem' }}>ℹ️</span>
          <span>Información del Torneo</span>
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
          Sistema de puntos, reglamento y desempates
        </p>
      </div>

      {/* Sistema de Puntos */}
      <div
        className="card"
        style={{
          marginBottom: '24px',
          backgroundColor: 'rgba(30, 127, 67, 0.05)',
          border: '2px solid var(--color-primary)',
          padding: '16px',
        }}
      >
        <h3
          style={{
            fontWeight: '700',
            color: 'var(--color-primary)',
            marginBottom: '16px',
            fontSize: '1.1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>📊</span>
          <span>Sistema de Puntos</span>
        </h3>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div
            style={{
              padding: '4px',
              backgroundColor: 'var(--color-surface)',
              borderRadius: '8px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '8px',
              }}
            >
              <span
                style={{
                  fontSize: '2rem',
                  minWidth: '40px',
                  textAlign: 'center',
                }}
              >
                🎯
              </span>
              <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.95rem' }}>
                PLENO (resultado exacto):
              </strong>
            </div>
            <div
              style={{
                marginLeft: '52px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                fontSize: '0.9rem',
                color: 'var(--color-text-secondary)',
              }}
            >
              <div>
                • Más de 2 goles:{' '}
                <span
                  style={{
                    color: 'var(--color-success)',
                    fontWeight: '700',
                  }}
                >
                  puntos = cantidad de goles
                </span>
              </div>
              <div>
                • 2 o menos goles:{' '}
                <span
                  style={{
                    color: 'var(--color-success)',
                    fontWeight: '700',
                  }}
                >
                  2 puntos
                </span>
              </div>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              backgroundColor: 'var(--color-surface)',
              borderRadius: '8px',
            }}
          >
            <span
              style={{
                fontSize: '2rem',
                minWidth: '40px',
                textAlign: 'center',
              }}
            >
              ✅
            </span>
            <div>
              <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.95rem' }}>
                Partidos de hasta 2 goles (acertar ganador/empate):
              </strong>
              <span
                style={{
                  marginLeft: '8px',
                  color: 'var(--color-success)',
                  fontWeight: '700',
                  fontSize: '1.1rem',
                }}
              >
                1 punto
              </span>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              backgroundColor: 'var(--color-surface)',
              borderRadius: '8px',
            }}
          >
            <span
              style={{
                fontSize: '2rem',
                minWidth: '40px',
                textAlign: 'center',
              }}
            >
              📈
            </span>
            <div>
              <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.95rem' }}>
                Más de 3 goles predichos ( acertar cantidad total de goles ) :
              </strong>
              <br />
              <span
                style={{
                  marginLeft: '8px',
                  color: 'var(--color-success)',
                  fontWeight: '700',
                  fontSize: '1.1rem',
                }}
              >
                1 punto
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Reglamento de Desempate y Premios */}
      <div
        className="card"
        style={{
          backgroundColor: 'rgba(59, 130, 246, 0.05)',
          border: '2px solid #3b82f6',
          padding: '16px',
        }}
      >
        <h3
          style={{
            fontWeight: '700',
            color: '#1e40af',
            marginBottom: '16px',
            fontSize: '1.1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <span>⚽</span>
          <span>REGLAMENTO DE DESEMPATE Y PREMIOS</span>
          <span>⚽</span>
        </h3>

        {/* Criterio de desempate */}
        <div style={{ marginBottom: '20px' }}>
          <h4
            style={{
              fontSize: '0.95rem',
              fontWeight: '700',
              color: '#1e40af',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>📌</span>
            <span>Criterio de desempate</span>
          </h4>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              paddingLeft: '8px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '8px',
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                borderRadius: '8px',
              }}
            >
              <span style={{ fontSize: '1.2rem', minWidth: '24px' }}>1️⃣</span>
              <div style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                <strong>Partido de la fecha</strong>
                <div
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--color-text-secondary)',
                    marginTop: '2px',
                  }}
                >
                  Ej: en la fecha 5, se toma el partido 5
                </div>
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '8px',
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                borderRadius: '8px',
              }}
            >
              <span style={{ fontSize: '1.2rem', minWidth: '24px' }}>2️⃣</span>
              <div style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                <strong>Mayor cantidad de plenos (2 pts)</strong>
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '8px',
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                borderRadius: '8px',
              }}
            >
              <span style={{ fontSize: '1.2rem', minWidth: '24px' }}>3️⃣</span>
              <div style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                <strong>Comparativa partido donde hayan sacado más Puntos</strong>
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '8px',
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                borderRadius: '8px',
              }}
            >
              <span style={{ fontSize: '1.2rem', minWidth: '24px' }}>4️⃣</span>
              <div style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                <strong>Partido Interzonal</strong>
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '8px',
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                borderRadius: '8px',
              }}
            >
              <span style={{ fontSize: '1.2rem', minWidth: '24px' }}>5️⃣</span>
              <div style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                <strong>Sorteo</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Regla especial */}
        <div
          style={{
            padding: '12px',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            borderRadius: '8px',
            border: '2px solid rgba(239, 68, 68, 0.2)',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
            }}
          >
            <span style={{ fontSize: '1.3rem' }}>🚫</span>
            <div>
              <strong
                style={{
                  fontSize: '0.95rem',
                  color: '#b91c1c',
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                Regla especial:
              </strong>
              <div style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                Nadie puede ganar más de 3 fechas, después de eso solo se compite por el trofeo 🏆
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  marginTop: '8px',
                  fontSize: '0.85rem',
                  color: 'var(--color-text-secondary)',
                }}
              >
                <span>➡️</span>
                <span>
                  Si pasa, el premio de la fecha se entrega al jugador que quedó en segunda
                  posición.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Último lugar */}
        {/* <div
          style={{
            padding: '12px',
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            borderRadius: '8px',
            border: '2px solid rgba(245, 158, 11, 0.2)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
            }}
          >
            <span style={{ fontSize: '1.3rem' }}>⚠️</span>
            <div>
              <strong
                style={{
                  fontSize: '0.95rem',
                  color: '#92400e',
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                Último lugar:
              </strong>
              <div style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                Si el último termina con 0 puntos, se le suma 1 punto más que el anteúltimo y sale
                de la última posición.
              </div>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  )
}
