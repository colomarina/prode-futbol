import type { ComponentProps, HTMLAttributes } from 'react'
import styles from './TextInput.module.css'

/** El teclado que se pide en mobile: `false` lo suprime, un string elige uno. */
type MobileKeyboard = false | HTMLAttributes<HTMLInputElement>['inputMode']

interface TextInputProps extends ComponentProps<'input'> {
  numeric?: boolean
  mobileKeyboard?: MobileKeyboard
}

export default function TextInput({
  className = '',
  numeric = false,
  mobileKeyboard,
  inputMode,
  pattern,
  ...props
}: TextInputProps) {
  const inputClassName = className ? `${styles.input} ${className}` : styles.input

  const resolvedInputMode =
    inputMode ??
    (mobileKeyboard === false
      ? 'none'
      : typeof mobileKeyboard === 'string'
        ? mobileKeyboard
        : numeric
          ? 'numeric'
          : undefined)

  const resolvedPattern = pattern ?? (numeric ? '[0-9]*' : undefined)

  return (
    <input
      {...props}
      inputMode={resolvedInputMode}
      pattern={resolvedPattern}
      className={inputClassName}
    />
  )
}
