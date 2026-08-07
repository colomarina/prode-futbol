import { Component } from 'react'
import styles from './ErrorBoundary.module.css'

/**
 * Un chunk que falla al cargar (deploy nuevo con una pestaña vieja abierta)
 * tira un error distinto al de un bug de render: se arregla recargando.
 */
const isChunkLoadError = error => {
  const message = `${error?.name || ''} ${error?.message || ''}`
  return /ChunkLoadError|Loading chunk|dynamically imported module|Failed to fetch/i.test(message)
}

/**
 * Error boundary. Sin esto, cualquier error de render deja la pantalla en blanco:
 * Suspense captura la carga de los lazy, pero no los errores.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = () => {
    this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    const { children, fallbackTitle } = this.props

    if (!error) return children

    const chunkError = isChunkLoadError(error)

    return (
      <div className={styles.container} role="alert">
        <div className={styles.card}>
          <span className={styles.icon} aria-hidden="true">
            {chunkError ? '🔄' : '⚠️'}
          </span>

          <h2 className={styles.title}>
            {chunkError ? 'Hay una version nueva' : fallbackTitle || 'Algo salio mal'}
          </h2>

          <p className={styles.message}>
            {chunkError
              ? 'Se publico una actualizacion mientras tenias la pagina abierta. Recarga para seguir.'
              : 'No pudimos mostrar esta seccion. Podes reintentar o recargar la pagina.'}
          </p>

          <div className={styles.actions}>
            {!chunkError && (
              <button type="button" className={styles.secondaryButton} onClick={this.handleReset}>
                Reintentar
              </button>
            )}
            <button type="button" className={styles.primaryButton} onClick={this.handleReload}>
              Recargar pagina
            </button>
          </div>

          {import.meta.env.DEV && (
            <pre className={styles.details}>{error.stack || error.message}</pre>
          )}
        </div>
      </div>
    )
  }
}

export default ErrorBoundary
