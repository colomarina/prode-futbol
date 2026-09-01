import { useState } from 'react'
import TextInput from '../TextInput'
import IconButton from '../IconButton'
import type { ComponentProps } from 'react'
import styles from './PasswordInput.module.css'

/**
 * Campo de contraseña con el ojo para mostrarla u ocultarla.
 *
 * Estaba escrito tres veces: en `Login` (con `IconButton` y estilos inline) y dos
 * veces en `UserProfile` (con un `<button>` crudo y clases propias), o sea el
 * mismo control con dos implementaciones distintas y tres `useState` iguales.
 *
 * El estado de visibilidad vive acá adentro a propósito: cada campo tiene su
 * propio ojo y ningún consumidor necesitaba leerlo. Para reiniciarlo desde afuera
 * —por ejemplo al cambiar de vista— alcanza con cambiarle la `key`.
 */
export default function PasswordInput({ className = '', ...props }: ComponentProps<'input'>) {
  const [visible, setVisible] = useState(false)

  return (
    <div className={styles.wrapper}>
      <TextInput
        {...props}
        type={visible ? 'text' : 'password'}
        className={`${styles.input} ${className}`.trim()}
      />
      <IconButton
        className={styles.toggle}
        onClick={() => setVisible(prev => !prev)}
        label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-pressed={visible}
      >
        {visible ? '🙈' : '👁️'}
      </IconButton>
    </div>
  )
}
