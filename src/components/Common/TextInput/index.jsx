import styles from './TextInput.module.css'

export default function TextInput({
  className = '',
  numeric = false,
  mobileKeyboard,
  inputMode,
  pattern,
  ...props
}) {
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
