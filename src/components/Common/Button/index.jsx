import styles from './Button.module.css'

/**
 * El botón de la app.
 *
 * Reemplaza a las clases sueltas `btn-*` de `App.css`, que se aplicaban a mano y
 * convivían con `btn` —una clase que **no existe en ningún lado** y que aun así
 * estaba escrita en cinco botones— y con decenas de estilos inline repetidos.
 *
 * `type` va en 'button' por defecto: sin `type` el navegador asume 'submit', y
 * eso hace que cualquier botón adentro de un `<form>` lo envíe sin querer. Los
 * que sí tienen que enviar el formulario lo declaran.
 *
 * @param {'primary'|'secondary'|'success'|'danger'|'info'|'outline'|'text'|'link'} variant
 * @param {'md'|'sm'|'lg'} size
 * @param {boolean} fullWidth
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  type = 'button',
  className = '',
  children,
  ...props
}) {
  const clases = [
    styles.button,
    styles[variant],
    size !== 'md' && styles[size],
    fullWidth && styles.fullWidth,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button type={type} className={clases} {...props}>
      {children}
    </button>
  )
}
