import { useState, useRef, useEffect, useLayoutEffect, useId, useCallback } from 'react'
import type { CSSProperties, KeyboardEvent, ReactNode } from 'react'
import LoadingState from '../LoadingState'
import styles from './SelectDropdown.module.css'

const SELECT_STYLE: CSSProperties = {
  width: '100%',
  padding: 'var(--space-md) var(--space-lg)',
  fontSize: 'var(--font-size-base)',
  borderRadius: 'var(--radius-lg)',
  border: '2px solid var(--color-primary)',
  cursor: 'pointer',
}

/**
 * Lo que identifica a una opcion cuando el consumidor no dice nada mas. No es solo
 * un uuid: la tabla de posiciones usa numeros de fecha, `null` para la general y el
 * literal `'playoffs'`.
 */
export type OptionId = string | number | null

/**
 * El tipo del id es un parametro (`TId`) y no un `OptionId` fijo.
 *
 * Con el tipo fijo, cada consumidor recibia de vuelta `string | number | null` y lo
 * metia en un `useState` tipado: los tres selectores de "Ver pronosticos" no
 * compilaban. Ahora el id sale inferido de `selectedId` y de `onSelect`, asi que
 * quien elige fechas recibe numeros y quien elige jugadores recibe uuids.
 */
interface SelectDropdownProps<T, TId> {
  items?: T[]
  selectedId?: TId
  onSelect: (id: TId) => void
  label?: ReactNode
  disabled?: boolean
  isLoading?: boolean
  renderButton?: (item: T) => ReactNode
  renderOption?: (item: T) => ReactNode
  placeholder?: string
  /** La propiedad de `item` que hace de id. */
  valueKey?: keyof T & string
}

/**
 * Un `<select>` hecho a mano: un boton que abre una lista de opciones.
 *
 * `label` no es decorativo. Esto es un `div` con botones, no un `<select>`, asi
 * que un `<label>` externo no se le puede asociar —lo marcaba el linter en seis
 * lugares— y el disparador quedaba sin nombre para un lector de pantalla. Al
 * declararlo aca, el widget se nombra a si mismo.
 *
 * ## El nombre del disparador incluye el valor elegido
 *
 * `aria-labelledby` **pisa** el contenido del boton, asi que apuntar solo al label
 * dejaba el nombre accesible en "Equipo" con el equipo elegido invisible: se
 * anunciaba la pregunta y nunca la respuesta. Por eso apunta a dos ids, el del
 * label y el del propio boton, y el nombre queda "Equipo River".
 *
 * ## Teclado
 *
 * La lista es un `role="listbox"` con `role="option"` en cada item, y el foco es
 * movil (roving): se mueve el foco del DOM entre los botones de las opciones en vez
 * de usar `aria-activedescendant`, porque las opciones ya eran botones de verdad.
 *
 * - Con la lista cerrada, `ArrowDown` y `ArrowUp` la abren. `Enter` y `Space` los
 *   maneja el boton nativo.
 * - Abierta: las flechas mueven, `Home` y `End` van a los extremos, `Escape` cierra
 *   y devuelve el foco al disparador, `Tab` cierra y sigue de largo. `Enter` y
 *   `Space` sobre una opcion los dispara el `<button>`, no hace falta atajarlos.
 * - El `.focus()` va con `preventScroll`: el centrado de la opcion elegida se
 *   calcula a mano mas abajo justamente para no arrastrar el scroll de la pagina, y
 *   un focus con scroll automatico lo desharia.
 */
const SelectDropdown = <T extends object, TId = OptionId>({
  items = [],
  selectedId,
  onSelect,
  label,
  disabled = false,
  isLoading = false,
  renderButton,
  renderOption,
  placeholder = 'Seleccionar...',
  valueKey = 'id' as keyof T & string,
}: SelectDropdownProps<T, TId>) => {
  const labelId = useId()
  const triggerId = useId()
  const [isOpen, setIsOpen] = useState(false)
  /** Cual opcion tiene el foco. `-1` mientras la lista esta cerrada. */
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const selectedOptionRef = useRef<HTMLButtonElement | null>(null)
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([])
  /**
   * El unico cast del componente, y esta acotado a un lugar: `item[valueKey]` es
   * `T[keyof T]` para TypeScript, pero por construccion siempre es el id.
   */
  const idDe = (item: T): TId => item[valueKey] as TId

  const selectedIndex = items.findIndex(item => idDe(item) === selectedId)
  const selectedItem = selectedIndex === -1 ? undefined : items[selectedIndex]

  const cerrar = useCallback(() => {
    setIsOpen(false)
    setActiveIndex(-1)
  }, [])

  /** Cierra y devuelve el foco al disparador, que es de donde salio. */
  const cerrarYVolverAlFoco = useCallback(() => {
    cerrar()
    triggerRef.current?.focus({ preventScroll: true })
  }, [cerrar])

  const abrir = useCallback(() => {
    setIsOpen(true)
    // Arranca sobre la opcion elegida; si no hay ninguna, sobre la primera.
    setActiveIndex(selectedIndex === -1 ? 0 : selectedIndex)
  }, [selectedIndex])

  // Cerrar dropdown cuando se clickea afuera
  useEffect(() => {
    const handleClickOutside = event => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        cerrar()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, cerrar])

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

  // El foco sigue a `activeIndex`. Corre despues del centrado y con `preventScroll`
  // para no pisarlo.
  useEffect(() => {
    if (!isOpen || activeIndex < 0) return
    optionRefs.current[activeIndex]?.focus({ preventScroll: true })
  }, [isOpen, activeIndex])

  const handleSelect = (id: TId): void => {
    onSelect(id)
    cerrar()
  }

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>): void => {
    if (disabled) return

    if (isOpen) {
      // Con la lista abierta el foco esta sobre una opcion, asi que esto solo corre
      // cuando la lista vino vacia y el foco nunca se movio. Sin esto, `Escape` no
      // cerraria una lista sin items.
      if (event.key === 'Escape') {
        event.preventDefault()
        cerrar()
      }
      return
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      abrir()
    }
  }

  const handleListKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const ultimo = items.length - 1

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setActiveIndex(i => (i >= ultimo ? 0 : i + 1))
        break
      case 'ArrowUp':
        event.preventDefault()
        setActiveIndex(i => (i <= 0 ? ultimo : i - 1))
        break
      case 'Home':
        event.preventDefault()
        setActiveIndex(0)
        break
      case 'End':
        event.preventDefault()
        setActiveIndex(ultimo)
        break
      case 'Escape':
        event.preventDefault()
        cerrarYVolverAlFoco()
        break
      case 'Tab':
        // Sin `preventDefault`: cierra y deja que el foco siga al control siguiente.
        cerrar()
        break
      default:
        break
    }
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
        id={triggerId}
        ref={triggerRef}
        onClick={() => {
          if (disabled) return
          if (isOpen) cerrar()
          else abrir()
        }}
        onKeyDown={handleTriggerKeyDown}
        disabled={disabled}
        // Los dos ids: el label nombra la pregunta y el propio boton aporta el valor
        // elegido. Apuntando solo al label, el valor no se anuncia nunca.
        aria-labelledby={label ? `${labelId} ${triggerId}` : undefined}
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
          {selectedItem && renderButton ? (
            renderButton(selectedItem)
          ) : (
            <span style={{ color: 'var(--color-text-secondary)' }}>{placeholder}</span>
          )}
        </span>
        <span
          aria-hidden="true"
          style={{ fontSize: 'var(--font-size-xl)', marginLeft: 'var(--space-sm)' }}
        >
          ▼
        </span>
      </button>

      {isOpen && !disabled && (
        <div
          ref={listRef}
          role="listbox"
          aria-labelledby={label ? labelId : undefined}
          // El `onKeyDown` va aca y no en cada opcion: los eventos burbujean desde
          // la opcion enfocada, asi que un solo handler cubre la lista entera.
          // `tabIndex={-1}` es lo que pide `jsx-a11y/interactive-supports-focus`
          // para un `role` interactivo, y no agrega la lista al orden de tabulacion.
          tabIndex={-1}
          onKeyDown={handleListKeyDown}
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
          {items.map((item, index) => {
            const estaElegida = selectedId === idDe(item)

            return (
              <button
                key={String(idDe(item))}
                ref={nodo => {
                  optionRefs.current[index] = nodo
                  if (estaElegida) selectedOptionRef.current = nodo
                }}
                type="button"
                role="option"
                aria-selected={estaElegida}
                // Foco movil: solo la opcion activa entra en el orden de tabulacion,
                // asi que `Tab` no camina por las 20 opciones de una lista larga.
                tabIndex={index === activeIndex ? 0 : -1}
                onClick={() => handleSelect(idDe(item))}
                style={{
                  width: '100%',
                  padding: 'var(--space-md) var(--space-lg)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-sm)',
                  border: 'none',
                  background: estaElegida ? 'var(--color-primary)' : 'transparent',
                  color: estaElegida ? 'var(--color-text-on-primary)' : 'var(--color-text-primary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 200ms',
                  fontSize: 'var(--font-size-base)',
                }}
                onMouseEnter={e => {
                  if (!estaElegida) {
                    e.currentTarget.style.background = 'var(--color-surface-variant)'
                  }
                }}
                onMouseLeave={e => {
                  if (!estaElegida) {
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                {renderOption?.(item)}
              </button>
            )
          })}
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
