import styles from './ToggleSwitch.module.css'

export default function ToggleSwitch({ checked, disabled = false, onChange, ariaLabel }) {
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
