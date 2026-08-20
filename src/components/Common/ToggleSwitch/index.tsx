import type { ChangeEvent } from 'react'
import styles from './ToggleSwitch.module.css'

interface ToggleSwitchProps {
  checked: boolean
  disabled?: boolean
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  ariaLabel: string
}

export default function ToggleSwitch({
  checked,
  disabled = false,
  onChange,
  ariaLabel,
}: ToggleSwitchProps) {
  return (
    <span className={styles.wrapper}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className={styles.input}
        aria-label={ariaLabel}
        role="switch"
        aria-checked={checked}
      />
      <span aria-hidden="true" className={styles.track} />
      <span aria-hidden="true" className={styles.thumb} />
    </span>
  )
}
