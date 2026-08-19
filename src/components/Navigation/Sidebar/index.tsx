import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext'
import { useTournament } from '../../../contexts/TournamentContext'
import { MENU_ITEMS } from './menu.config'
import { filterVisibleTournaments } from '../../../utils/tournamentAccess'
import HamburgerButton from './HamburgerButton'
import TournamentDrawer from './TournamentDrawer'
import MainMenuView from './Views/MainMenuView'
import type { MenuItem } from './menu.config'

export default function Sidebar({
  onNavigate,
  onSignOut,
}: {
  onNavigate?: (viewType: string) => void
  onSignOut?: () => void | Promise<unknown>
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { isAdmin } = useAuth()
  const { tournaments, setActiveTournament, isReadOnly } = useTournament()
  const navigate = useNavigate()

  // Filtrar items del menú según permisos.
  // En un torneo finalizado la administración se oculta para todos: el torneo es solo lectura.
  const visibleMenuItems = useMemo(
    () => MENU_ITEMS.filter(item => !item.adminOnly || (isAdmin() && !isReadOnly)),
    [isAdmin, isReadOnly]
  )

  // Se cuentan solo los que este usuario puede ver: si el unico torneo extra es
  // uno de prueba, ofrecerle "Cambiar torneo" no tendria a donde llevarlo.
  const visibleTournamentCount = useMemo(
    () => filterVisibleTournaments(tournaments, isAdmin()).length,
    [tournaments, isAdmin]
  )

  const menuItems = useMemo(() => {
    if (visibleTournamentCount <= 1) {
      return visibleMenuItems
    }

    const changeTournamentItem: MenuItem = {
      id: 'change-tournament',
      type: 'change_tournament',
      label: 'Cambiar torneo',
      icon: '🔄',
      description: 'Elegir otro torneo disponible',
      adminOnly: false,
    }

    const logoutIndex = visibleMenuItems.findIndex(item => item.type === 'logout')

    if (logoutIndex === -1) {
      return [...visibleMenuItems, changeTournamentItem]
    }

    return [
      ...visibleMenuItems.slice(0, logoutIndex),
      changeTournamentItem,
      ...visibleMenuItems.slice(logoutIndex),
    ]
  }, [visibleTournamentCount, visibleMenuItems])

  const handleOpen = () => setIsOpen(true)
  const handleClose = () => setIsOpen(false)

  const handleSelectItem = async item => {
    if (item.type === 'change_tournament') {
      setActiveTournament(null)
      // A la raiz: sin torneo activo, App muestra el selector.
      navigate('/', { replace: true })
      setIsOpen(false)
      return
    }

    // Manejar logout
    if (item.type === 'logout' && onSignOut) {
      setIsLoggingOut(true)
      try {
        await onSignOut()
      } finally {
        setIsLoggingOut(false)
        setIsOpen(false)
      }
      return
    }

    // Cerrar drawer y navegar
    setIsOpen(false)

    // Navegar a la vista seleccionada
    if (item.viewType && onNavigate) {
      onNavigate(item.viewType)
    }
  }

  return (
    <>
      <HamburgerButton onClick={handleOpen} />
      <TournamentDrawer
        isOpen={isOpen}
        onClose={handleClose}
        title="⚽ Menú"
        showBackButton={false}
      >
        <MainMenuView
          menuItems={menuItems}
          onSelectItem={handleSelectItem}
          isLoggingOut={isLoggingOut}
        />
      </TournamentDrawer>
    </>
  )
}
