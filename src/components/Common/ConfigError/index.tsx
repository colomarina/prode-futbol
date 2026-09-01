import styles from './ConfigError.module.css'

/**
 * Pantalla de error de configuración. Reemplaza a la pantalla en blanco que
 * aparecía cuando el deploy no tenía cargadas las variables de entorno.
 */
export default function ConfigError({ missingVars }: { missingVars: string[] }) {
  return (
    <div className={styles.container} role="alert">
      <div className={styles.card}>
        <span className={styles.icon} aria-hidden="true">
          🔌
        </span>

        <h1 className={styles.title}>Falta configurar la app</h1>

        <p className={styles.message}>
          No se puede conectar con la base de datos porque{' '}
          {missingVars.length === 1
            ? 'falta esta variable de entorno'
            : 'faltan estas variables de entorno'}
          :
        </p>

        <ul className={styles.list}>
          {missingVars.map(name => (
            <li key={name}>
              <code>{name}</code>
            </li>
          ))}
        </ul>

        <p className={styles.hint}>
          En local: copiá <code>.env.example</code> a <code>.env</code> y completalas.
          <br />
          En Vercel: revisá que estén cargadas para el entorno de este deploy (Production, Preview y
          Development se configuran por separado).
        </p>
      </div>
    </div>
  )
}
