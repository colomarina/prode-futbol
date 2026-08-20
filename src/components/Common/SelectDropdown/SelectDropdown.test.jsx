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

    // El nombre es el label mas el contenido del boton: sin seleccion, el placeholder.
    expect(screen.getByRole('button', { name: 'Equipo Seleccionar...' })).toBeInTheDocument()
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

  // Venia con `it.fails` en el commit anterior, documentando el bug: el nombre
  // accesible del disparador no incluia el valor elegido. Arreglado, pasa normal.
  it('con seleccion muestra el item elegido con renderButton', () => {
    armar({ selectedId: 'b' })

    expect(screen.getByRole('button', { name: /River/ })).toBeInTheDocument()
  })

  it('el nombre accesible del disparador incluye el valor elegido', () => {
    // Era un bug: `aria-labelledby` pisa el contenido del boton, asi que apuntando
    // solo al label el nombre quedaba en "Equipo" y el equipo elegido no se
    // anunciaba nunca. Se anuncia la pregunta y no la respuesta.
    armar({ selectedId: 'b' })

    expect(screen.getByRole('button', { name: 'Equipo River' })).toBeInTheDocument()
  })

  it('el chevron no entra en el nombre accesible', () => {
    // Sin `aria-hidden` el nombre terminaba en "Equipo River ▼": el nombre exacto
    // del test de arriba es lo que lo verifica, esto deja escrito por que.
    armar({ selectedId: 'b' })

    expect(screen.queryByRole('button', { name: /▼/ })).toBeNull()
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

    await user.click(screen.getByRole('button', { name: 'Fecha Seleccionar...' }))
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

    await user.click(screen.getByRole('button', { name: 'Equipo Seleccionar...' }))

    expect(screen.getByRole('button', { name: 'Equipo Seleccionar...' })).toHaveAttribute(
      'aria-expanded',
      'true'
    )
  })
})

describe('SelectDropdown, roles de listbox', () => {
  it('la lista es un listbox con una opcion por item', async () => {
    const user = userEvent.setup()
    armar()

    await user.click(disparador())

    expect(screen.getByRole('listbox', { name: 'Equipo' })).toBeInTheDocument()
    expect(screen.getAllByRole('option')).toHaveLength(3)
  })

  it('marca con aria-selected cual esta elegida, y solo esa', async () => {
    const user = userEvent.setup()
    armar({ selectedId: 'b' })

    await user.click(disparador())

    const opciones = screen.getAllByRole('option')
    expect(opciones.map(o => o.getAttribute('aria-selected'))).toEqual(['false', 'true', 'false'])
  })

  it('la lista no queda en el orden de tabulacion', async () => {
    const user = userEvent.setup()
    armar()

    await user.click(disparador())

    expect(screen.getByRole('listbox')).toHaveAttribute('tabindex', '-1')
  })
})

describe('SelectDropdown, teclado', () => {
  it('las flechas abren la lista con el disparador enfocado', async () => {
    const user = userEvent.setup()
    armar()

    disparador().focus()
    await user.keyboard('{ArrowDown}')

    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('al abrir, el foco arranca en la opcion elegida', async () => {
    const user = userEvent.setup()
    armar({ selectedId: 'c' })

    await user.click(disparador())

    expect(screen.getAllByRole('option')[2]).toHaveFocus()
  })

  it('sin nada elegido el foco arranca en la primera', async () => {
    const user = userEvent.setup()
    armar()

    await user.click(disparador())

    expect(screen.getAllByRole('option')[0]).toHaveFocus()
  })

  it('ArrowDown y ArrowUp mueven el foco', async () => {
    const user = userEvent.setup()
    armar()

    await user.click(disparador())
    await user.keyboard('{ArrowDown}')
    expect(screen.getAllByRole('option')[1]).toHaveFocus()

    await user.keyboard('{ArrowUp}')
    expect(screen.getAllByRole('option')[0]).toHaveFocus()
  })

  it('ArrowDown en la ultima vuelve a la primera, y ArrowUp al revez', async () => {
    const user = userEvent.setup()
    armar()

    await user.click(disparador())
    await user.keyboard('{ArrowUp}')
    // Desde la primera, hacia arriba, cae en la ultima.
    expect(screen.getAllByRole('option')[2]).toHaveFocus()

    await user.keyboard('{ArrowDown}')
    expect(screen.getAllByRole('option')[0]).toHaveFocus()
  })

  it('Home y End van a los extremos', async () => {
    const user = userEvent.setup()
    armar({ selectedId: 'b' })

    await user.click(disparador())
    await user.keyboard('{End}')
    expect(screen.getAllByRole('option')[2]).toHaveFocus()

    await user.keyboard('{Home}')
    expect(screen.getAllByRole('option')[0]).toHaveFocus()
  })

  it('Enter sobre una opcion la elige', async () => {
    const user = userEvent.setup()
    const { onSelect } = armar()

    await user.click(disparador())
    await user.keyboard('{ArrowDown}{Enter}')

    expect(onSelect).toHaveBeenCalledWith('b')
  })

  it('Space sobre una opcion la elige', async () => {
    const user = userEvent.setup()
    const { onSelect } = armar()

    await user.click(disparador())
    await user.keyboard(' ')

    expect(onSelect).toHaveBeenCalledWith('a')
  })

  it('Escape cierra y devuelve el foco al disparador', async () => {
    const user = userEvent.setup()
    const { onSelect } = armar()

    await user.click(disparador())
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(disparador()).toHaveFocus()
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('Escape cierra tambien una lista vacia, donde el foco nunca se movio', async () => {
    const user = userEvent.setup()
    render(<SelectDropdown label="Equipo" items={[]} selectedId={null} onSelect={vi.fn()} />)

    const boton = screen.getByRole('button', { name: 'Equipo Seleccionar...' })
    await user.click(boton)
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('Tab cierra la lista y no la atrapa', async () => {
    const user = userEvent.setup()
    armar()

    await user.click(disparador())
    await user.keyboard('{Tab}')

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('un segundo click en el disparador cierra', async () => {
    const user = userEvent.setup()
    armar()

    await user.click(disparador())
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    await user.click(disparador())
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
