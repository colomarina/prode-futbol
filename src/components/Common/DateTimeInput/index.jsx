import { useId } from 'react'
import DatePicker, { registerLocale } from 'react-datepicker'
import { es } from 'date-fns/locale'
import 'react-datepicker/dist/react-datepicker.css'

registerLocale('es', es)

const pickerStyles = `
  .react-datepicker {
    border: 1px solid var(--color-border);
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
    font-family: inherit;
  }

  .react-datepicker__header {
    background: var(--color-surface-variant);
    border-bottom: 1px solid var(--color-border);
  }

  .react-datepicker__current-month,
  .react-datepicker-time__header,
  .react-datepicker-year-header {
    color: var(--color-text-primary);
  }

  .react-datepicker__day--selected,
  .react-datepicker__day--in-selecting-range,
  .react-datepicker__day--in-range,
  .react-datepicker__month-text--selected,
  .react-datepicker__quarter-text--selected,
  .react-datepicker__year-text--selected {
    background-color: var(--color-primary);
    color: white;
  }

  .react-datepicker__day:hover,
  .react-datepicker__month-text:hover,
  .react-datepicker__quarter-text:hover,
  .react-datepicker__year-text:hover {
    background-color: var(--color-surface-variant);
  }

  .react-datepicker__time-container .react-datepicker__time {
    border-radius: 0 0 12px 12px;
  }

  .react-datepicker__time-box {
    width: 100%;
  }

  .react-datepicker__input-container input {
    width: 100%;
    border: none;
    outline: none;
    background: transparent;
    color: var(--color-text-primary);
    font-size: 0.95rem;
    line-height: 1.4;
    padding: 0;
  }
`

export default function DateTimeInput({
  id,
  label,
  value,
  onChange,
  disabled = false,
  placeholder = 'Seleccionar fecha y hora',
  style,
}) {
  const generatedId = useId()
  const inputId = id || generatedId

  const selectedValue = value ? new Date(value) : null

  const handleChange = date => {
    if (!onChange) return

    const currentValue = date ? date.toISOString() : ''
    onChange({ target: { value: currentValue } })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', ...style }}>
      {label ? (
        <label htmlFor={inputId} className="form-label" style={{ display: 'block' }}>
          {label}
        </label>
      ) : null}

      <style>{pickerStyles}</style>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          width: '100%',
          padding: '12px 14px',
          borderRadius: '12px',
          border: '1px solid var(--color-border)',
          backgroundColor: disabled ? 'var(--color-surface-variant)' : 'var(--color-surface)',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.03)',
        }}
      >
        <span
          style={{
            fontSize: '1rem',
            color: 'var(--color-primary)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          📅
        </span>
        <DatePicker
          id={inputId}
          selected={selectedValue}
          onChange={handleChange}
          showTimeSelect
          timeFormat="HH:mm"
          timeIntervals={15}
          dateFormat="dd/MM/yyyy HH:mm"
          locale="es"
          placeholderText={placeholder}
          timeCaption="Horario"
          showPopperArrow={false}
          disabled={disabled}
          popperPlacement="bottom-end"
          wrapperClassName=""
          className=""
          style={{ width: '100%' }}
        />
      </div>
    </div>
  )
}
