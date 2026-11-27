import { useState, useEffect, useMemo } from 'react'
import { useRounds } from '../../hooks/useRounds'
import { useRoundProgress } from '../../hooks/useRoundProgress'
import { useMatches } from '../../hooks/useMatches'
import { useMatchesMeta } from '../../hooks/useMatchesMeta'
import { getFinishedRoundNumbers } from '../../utils/leaderboardRounds'
import { useTournament } from '../../contexts/TournamentContext'
import Toast from '../Common/Toast'
import LoadingState from '../Common/LoadingState'
import EmptyState from '../Common/EmptyState'
import PageHeader from '../Common/PageHeader'
import ActiveRoundCard from './ActiveRoundCard'
import { buildMatchLabels } from './progress'
import type { ToastType } from '../Common/Toast'
import styles from './RoundManager.module.css'

export default function RoundManager() {
  const { activeTournament } = useTournament()
  const { activeRound, loading } = useRounds(activeTournament?.id)
  const { matchesMeta } = useMatchesMeta(activeTournament?.id)
  const roundInPlay = useMemo(() => {
    if (!activeRound) return null
    return getFinishedRoundNumbers(matchesMeta).has(activeRound.round_number) ? null : activeRound
  }, [activeRound, matchesMeta])
  const activeRoundNumber = roundInPlay?.round_number ?? null
  const {
    progress,
    loading: progressLoading,
    error: progressError,
  } = useRoundProgress(activeTournament?.id, activeRoundNumber)
  const { matches } = useMatches(activeRoundNumber, activeTournament?.id)
  const matchLabels = useMemo(() => buildMatchLabels(matches), [matches])
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  useEffect(() => {
    if (progressError) {
      setToast({ message: 'No se pudo cargar el progreso de los jugadores', type: 'error' })
    }
  }, [progressError])

  return (
    <div className={styles.container}>
      <PageHeader icon="📅" title="Fechas" subtitle="Quién ya pronosticó la fecha en juego" />

      {loading ? (
        <LoadingState message="Cargando fechas..." />
      ) : roundInPlay ? (
        <ActiveRoundCard
          round={roundInPlay}
          players={progress}
          matchLabels={matchLabels}
          loading={progressLoading}
          error={Boolean(progressError)}
        />
      ) : (
        <EmptyState
          icon="📅"
          title="No hay una fecha en juego"
          description="Cuando se cargue la próxima fecha, acá vas a ver quién ya pronosticó."
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
