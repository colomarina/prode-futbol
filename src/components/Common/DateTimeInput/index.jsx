import { useId } from 'react'
// eslint-disable-next-line import-x/no-named-as-default
import DatePicker, { registerLocale } from 'react-datepicker'
import { es } from 'date-fns/locale'
import 'react-datepicker/dist/react-datepicker.css'
import '../../../styles/datepicker-theme.css'

registerLocale('es', es)

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
