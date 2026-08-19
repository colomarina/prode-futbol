import { useId } from 'react'
import type { CSSProperties, ReactNode } from 'react'
// eslint-disable-next-line import-x/no-named-as-default
import DatePicker, { registerLocale } from 'react-datepicker'
import { es } from 'date-fns/locale'
import 'react-datepicker/dist/react-datepicker.css'
import '../../../styles/datepicker-theme.css'

registerLocale('es', es)

/**
 * El `onChange` recibe un **evento falso** (`{ target: { value } }`) y no el `Date`
 * que da react-datepicker: es para que los consumidores lo traten igual que a un
 * `<input>`, que es como estaban escritos antes de que este componente existiera.
 * El tipo lo deja explicito en vez de que se descubra leyendo el handler.
 */
export interface DateTimeChangeEvent {
  target: { value: string }
}

interface DateTimeInputProps {
  id?: string
  label?: ReactNode
  /** Un ISO string, o vacio. */
  value?: string | null
  onChange?: (event: DateTimeChangeEvent) => void
  disabled?: boolean
  placeholder?: string
  style?: CSSProperties
}

export default function DateTimeInput({
  id,
  label,
  value,
  onChange,
  disabled = false,
  placeholder = 'Seleccionar fecha y hora',
  style,
}: DateTimeInputProps) {
  const generatedId = useId()
  const inputId = id || generatedId

  const selectedValue = value ? new Date(value) : null

  const handleChange = (date: Date | null): void => {
    if (!onChange) return

    const currentValue = date ? date.toISOString() : ''
    onChange({ target: { value: currentValue } })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', ...style }}>
      {label ? (
        <label htmlFor={inputId} className="form-label" style={{ display: 'block' }}>
          {label}
        </label>
      ) : null}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)',
          width: '100%',
          padding: 'var(--space-md) var(--space-md)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          backgroundColor: disabled ? 'var(--color-surface-variant)' : 'var(--color-surface)',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.03)',
        }}
      >
        <span
          style={{
            fontSize: 'var(--font-size-base)',
            color: 'var(--color-primary-text)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          📅
        </span>
        {/*
          Aca habia un `style={{ width: '100%' }}` que **no hacia nada**:
          react-datepicker no acepta `style` (lo marco el tipado al migrar). O sea que
          el ancho completo que se buscaba nunca se aplico al input. Si se lo quiere de
          verdad, va por `className` o `wrapperClassName`, que hoy se pasan vacios —
          pero eso es un cambio visual y se decide aparte.
        */}
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
        />
      </div>
    </div>
  )
}
