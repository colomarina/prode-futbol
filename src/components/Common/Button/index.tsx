import type { ComponentProps } from 'react'
import styles from './Button.module.css'

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'info'
  | 'outline'
  | 'text'
  | 'link'

interface ButtonProps extends ComponentProps<'button'> {
  variant?: ButtonVariant
  size?: 'md' | 'sm' | 'lg'
  fullWidth?: boolean
}

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
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  type = 'button',
  className = '',
  children,
  ...props
}: ButtonProps) {
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
