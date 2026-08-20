import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SelectDropdown from './index'

/**
 * Este componente lo usan 8 pantallas y hasta la fase 8 no tenia un solo test.
 * Se noto al migrarlo a TypeScript en la fase 7: una recursion infinita que se
 * introdujo ahi la atajo el lint, no los tests.
 *
 * El archivo empieza describiendo el contrato que ya existia, para poder tocarle
 * el manejo de teclado sabiendo que lo de antes sigue funcionando.
 */

const EQUIPOS = [
  { id: 'a', name: 'Boca' },
  { id: 'b', name: 'River' },
  { id: 'c', name: 'Racing' },
]

const armar = (props = {}) => {
  const onSelect = props.onSelect ?? vi.fn()
  const utils = render(
    <SelectDropdown
      label="Equipo"
      items={EQUIPOS}
      selectedId={null}
      renderButton={equipo => <span>{equipo.name}</span>}
      renderOption={equipo => <span>{equipo.name}</span>}
      {...props}
      onSelect={onSelect}
    />
  )
  return { ...utils, onSelect }
}

const disparador = () => screen.getByRole('button', { name: /Equipo|Seleccionar/ })

describe('SelectDropdown, el nombre y el estado', () => {
  it('el disparador toma su nombre del label, que no es un <label> asociable', () => {
    // Es un div con botones, no un <select>: un <label> externo no se le puede
    // asociar. El widget se nombra a si mismo con aria-labelledby.
    armar()

    expect(screen.getByRole('button', { name: 'Equipo' })).toBeInTheDocument()
  })

  it('sin label el disparador no queda con un aria-labelledby colgado', () => {
    armar({ label: undefined })

    const boton = screen.getByRole('button')
    expect(boton).not.toHaveAttribute('aria-labelledby')
  })

  it('anuncia que abre un listbox y si esta abierto o cerrado', async () => {
    const user = userEvent.setup()
    armar()

    const boton = disparador()
    expect(boton).toHaveAttribute('aria-haspopup', 'listbox')
    expect(boton).toHaveAttribute('aria-expanded', 'false')

    await user.click(boton)
    expect(boton).toHaveAttribute('aria-expanded', 'true')
  })

  it('dos dropdowns en la misma pantalla no comparten el id del label', () => {
    render(
      <>
        <SelectDropdown label="Uno" items={[]} onSelect={vi.fn()} />
        <SelectDropdown label="Dos" items={[]} onSelect={vi.fn()} />
      </>
    )

    expect(screen.getByText('Uno').id).not.toBe(screen.getByText('Dos').id)
  })
})

describe('SelectDropdown, lo que muestra', () => {
  it('sin seleccion muestra el placeholder', () => {
    armar({ placeholder: 'Elegi un equipo' })

    expect(screen.getByText('Elegi un equipo')).toBeInTheDocument()
  })

  /*
   * `it.fails` y no un test en rojo.
   *
   * Este es el bug: `aria-labelledby` **pisa** el contenido del boton, asi que
   * apuntando solo al label el nombre accesible del disparador queda en "Equipo" y
   * el equipo elegido no se anuncia nunca. Se anuncia la pregunta y jamas la
   * respuesta, en los 8 lugares que usan el componente.
   *
   * Dejarlo fallando de verdad pondria la rama en rojo en este commit; marcarlo como
   * "se espera que falle" dice exactamente lo mismo, queda escrito en el codigo, y la
   * suite pasa. El commit que sigue arregla el componente y lo vuelve un `it` normal.
   */
  it.fails('con seleccion muestra el item elegido con renderButton', () => {
    armar({ selectedId: 'b' })

    expect(screen.getByRole('button', { name: /River/ })).toBeInTheDocument()
  })

  it('las opciones aparecen recien al abrir', async () => {
    const user = userEvent.setup()
    armar()

    expect(screen.queryByText('Racing')).not.toBeInTheDocument()

    await user.click(disparador())
    expect(screen.getByText('Racing')).toBeInTheDocument()
  })

  it('un id que no esta en la lista cae al placeholder en vez de romper', () => {
    armar({ selectedId: 'no-existe' })

    expect(screen.getByText('Seleccionar...')).toBeInTheDocument()
  })

  it('isLoading muestra el estado de carga sin tapar el disparador', () => {
    armar({ isLoading: true })

    expect(screen.getByText('Cargando...')).toBeInTheDocument()
    expect(disparador()).toBeInTheDocument()
  })
})

describe('SelectDropdown, elegir', () => {
  it('avisa el id elegido y cierra la lista', async () => {
    const user = userEvent.setup()
    const { onSelect } = armar()

    await user.click(disparador())
    await user.click(screen.getByText('River'))

    expect(onSelect).toHaveBeenCalledWith('b')
    expect(screen.queryByText('Racing')).not.toBeInTheDocument()
  })

  it('valueKey cambia cual propiedad hace de id', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <SelectDropdown
        label="Fecha"
        items={[{ round_number: 7, name: 'Fecha 7' }]}
        selectedId={null}
        valueKey="round_number"
        onSelect={onSelect}
        renderButton={r => <span>{r.name}</span>}
        renderOption={r => <span>{r.name}</span>}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Fecha' }))
    await user.click(screen.getByText('Fecha 7'))

    // El id es el numero de fecha, no un uuid: la tabla de posiciones depende de esto.
    expect(onSelect).toHaveBeenCalledWith(7)
  })

  it('un click afuera cierra sin elegir nada', async () => {
    const user = userEvent.setup()
    const { onSelect } = armar()

    await user.click(disparador())
    expect(screen.getByText('Racing')).toBeInTheDocument()

    await user.click(document.body)

    expect(screen.queryByText('Racing')).not.toBeInTheDocument()
    expect(onSelect).not.toHaveBeenCalled()
  })
})

describe('SelectDropdown, deshabilitado', () => {
  it('no abre y el disparador queda fuera del tab', async () => {
    const user = userEvent.setup()
    armar({ disabled: true })

    const boton = disparador()
    expect(boton).toBeDisabled()

    await user.click(boton)
    expect(screen.queryByText('Racing')).not.toBeInTheDocument()
  })
})

describe('SelectDropdown, listas vacias', () => {
  it('sin items abre una lista vacia en vez de romper', async () => {
    const user = userEvent.setup()
    render(<SelectDropdown label="Equipo" items={[]} selectedId={null} onSelect={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Equipo' }))

    expect(screen.getByRole('button', { name: 'Equipo' })).toHaveAttribute('aria-expanded', 'true')
  })
})
