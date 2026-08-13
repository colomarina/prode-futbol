import { useState, useRef, useEffect, useLayoutEffect, useId } from 'react'
import LoadingState from '../LoadingState'
import styles from './SelectDropdown.module.css'

const SELECT_STYLE = {
  width: '100%',
  padding: 'var(--space-md) var(--space-lg)',
  fontSize: 'var(--font-size-base)',
  borderRadius: 'var(--radius-lg)',
  border: '2px solid var(--color-primary)',
  cursor: 'pointer',
}

/**
 * `label` no es decorativo: esto es un `div` con botones, no un `<select>`, así
 * que un `<label>` externo no se le puede asociar —lo marcaba el linter en seis
 * lugares— y el disparador quedaba sin nombre para un lector de pantalla. Al
 * declararlo acá, el widget se nombra a sí mismo con `aria-labelledby`.
 *
 * `aria-expanded` y `aria-haspopup` van por lo mismo. Falta bastante para que sea
 * un combobox de verdad (`role="listbox"`, navegación por flechas): eso es la
 * fase 8, acá solo se cubre el nombre y el estado.
 */
const SelectDropdown = ({
  items = [],
  selectedId,
  onSelect,
  label,
  disabled = false,
  isLoading = false,
  renderButton,
  renderOption,
  placeholder = 'Seleccionar...',
  valueKey = 'id',
}) => {
  const labelId = useId()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)
  const listRef = useRef(null)
  const selectedOptionRef = useRef(null)
  const selectedItem = items.find(item => item[valueKey] === selectedId)

  // Cerrar dropdown cuando se clickea afuera
  useEffect(() => {
    const handleClickOutside = event => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Al abrir, centrar la opción seleccionada dentro de la lista para que siempre quede a la vista.
  // Se calcula el scrollTop a mano (en vez de scrollIntoView) para no arrastrar el scroll de la página.
  useLayoutEffect(() => {
    if (!isOpen) return

    const list = listRef.current
    const option = selectedOptionRef.current
    if (!list || !option) return

    const centeredTop = option.offsetTop - list.clientHeight / 2 + option.offsetHeight / 2
    list.scrollTop = Math.max(0, Math.min(centeredTop, list.scrollHeight - list.clientHeight))
  }, [isOpen])

  const handleSelect = id => {
    onSelect(id)
    setIsOpen(false)
  }

  return (
    <div style={{ position: 'relative' }} ref={containerRef}>
      {label && (
        <span id={labelId} className={styles.label}>
          {label}
        </span>
      )}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-labelledby={label ? labelId : undefined}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        style={{
          ...SELECT_STYLE,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: disabled ? 'var(--color-surface-variant)' : 'var(--color-surface)',
          color: disabled ? 'var(--color-text-secondary)' : 'var(--color-text-primary)',
          opacity: disabled ? 0.6 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-sm)',
            flex: 1,
            overflow: 'hidden',
          }}
        >
          {selectedItem ? (
            renderButton(selectedItem)
          ) : (
            <span style={{ color: 'var(--color-text-secondary)' }}>{placeholder}</span>
          )}
        </span>
        <span style={{ fontSize: 'var(--font-size-xl)', marginLeft: 'var(--space-sm)' }}>▼</span>
      </button>

      {isOpen && !disabled && (
        <div
          ref={listRef}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'var(--color-surface)',
            border: '2px solid var(--color-primary)',
            borderRadius: 'var(--radius-lg)',
            marginTop: 'var(--space-2xs)',
            maxHeight: '300px',
            overflowY: 'auto',
            zIndex: 'var(--z-dropdown)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          {items.map(item => (
            <button
              key={item[valueKey]}
              ref={selectedId === item[valueKey] ? selectedOptionRef : null}
              onClick={() => handleSelect(item[valueKey])}
              style={{
                width: '100%',
                padding: 'var(--space-md) var(--space-lg)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-sm)',
                border: 'none',
                background: selectedId === item[valueKey] ? 'var(--color-primary)' : 'transparent',
                color:
                  selectedId === item[valueKey]
                    ? 'var(--color-text-on-primary)'
                    : 'var(--color-text-primary)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 200ms',
                // borderBottom: '1px solid var(--color-border)',
                fontSize: 'var(--font-size-base)',
              }}
              onMouseEnter={e => {
                if (selectedId !== item[valueKey]) {
                  e.currentTarget.style.background = 'var(--color-surface-variant)'
                }
              }}
              onMouseLeave={e => {
                if (selectedId !== item[valueKey]) {
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              {renderOption(item)}
            </button>
          ))}
        </div>
      )}

      {isLoading && (
        <LoadingState
          message="Cargando..."
          size="xs"
          style={{ marginTop: 'var(--space-sm)', padding: 0 }}
        />
      )}
    </div>
  )
}

export default SelectDropdown
