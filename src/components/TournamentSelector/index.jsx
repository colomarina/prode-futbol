import { useEffect } from 'react'
import styles from './TournamentSelector.module.css'
import TournamentCard from './TournamentCard'

export default function TournamentSelector({
  tournaments,
  loading,
  onSelect,
  isTournamentDisabled = () => false,
}) {
  //   Auto-select if only one active tournament
  useEffect(() => {
    if (!loading && tournaments.length > 0) {
      const selectableTournaments = tournaments.filter(
        tournament => !isTournamentDisabled(tournament)
      )

      if (selectableTournaments.length === 1 && tournaments.length === 1) {
        onSelect(selectableTournaments[0])
      }
    }
  }, [loading, tournaments, onSelect, isTournamentDisabled])

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingSpinner}>
          <div className={styles.spinner}></div>
          <p>Cargando torneos...</p>
        </div>
      </div>
    )
  }

  // If auto-selected, don't show selector
  const selectableTournaments = tournaments.filter(tournament => !isTournamentDisabled(tournament))
  if (selectableTournaments.length === 1 && tournaments.length === 1) {
    return null
  }

  // El torneo en curso va primero, después el resto de los accesibles (finalizados) y
  // al final los bloqueados. Dentro de cada grupo se respeta el orden de creación.
  const getSortPriority = tournament => {
    if (tournament.status === 'active') return 0
    return isTournamentDisabled(tournament) ? 2 : 1
  }

  const sortedTournaments = [...tournaments].sort((a, b) => getSortPriority(a) - getSortPriority(b))

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Selecciona un Torneo</h1>
        <p>Elige el torneo con el que quieres jugar</p>
      </header>

      <div className={styles.grid}>
        {sortedTournaments.map(tournament => (
          <TournamentCard
            key={tournament.id}
            tournament={tournament}
            onClick={onSelect}
            disabled={isTournamentDisabled(tournament)}
          />
        ))}
      </div>
    </div>
  )
}
