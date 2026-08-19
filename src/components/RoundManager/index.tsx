import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRounds } from '../../hooks/useRounds'
import { useMatchesMeta } from '../../hooks/useMatchesMeta'
import { useRoundProgress } from '../../hooks/useRoundProgress'
import { useTournament } from '../../contexts/TournamentContext'
import Toast from '../Common/Toast'
import LoadingState from '../Common/LoadingState'
import ActiveRoundCard from './ActiveRoundCard'
import RoundCard from './RoundCard'
import { ROUND_STATUSES, getFinishability } from './roundStatus'
import { getRoundDisplayName, getRoundDisplayNameByNumber } from '../../utils/roundLabels'
import type { MatchCount } from './roundStatus'
import type { ToastType } from '../Common/Toast'
import styles from './RoundManager.module.css'

/**
 * Panel de administración de las fechas del torneo.
 *
 * Este archivo era de 851 líneas y concentraba la consulta del progreso de
 * jugadores (la última lectura de Supabase que quedaba dentro de un componente),
 * la paleta de los cuatro estados y 400 líneas de JSX con estilos inline. Ahora es
 * solo el shell: los datos vienen de tres hooks y la UI de `ActiveRoundCard` y
 * `RoundCard`. Acá quedan los handlers, que son lo único que decide algo.
 */
export default function RoundManager() {
  const { activeTournament } = useTournament()
  const { rounds, activeRound, updateRoundStatus, finishRound, loading } = useRounds(
    activeTournament?.id
  )
  const { matchesMeta } = useMatchesMeta(activeTournament?.id)
  const { progress, error: progressError } = useRoundProgress(
    activeTournament?.id,
    activeRound?.round_number ?? null
  )
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  const formatRoundLabel = useCallback(
    (roundNumber: number): string => getRoundDisplayNameByNumber(roundNumber, rounds),
    [rounds]
  )

  // Cuántos partidos tiene cada fecha y cuántos ya terminaron. Sale de la misma
  // query compartida que usa useRounds, no de una consulta propia.
  const matchesByRound = useMemo(() => {
    const byRound: Record<number, MatchCount> = {}

    matchesMeta.forEach(match => {
      if (!byRound[match.round_number]) {
        byRound[match.round_number] = { total: 0, finished: 0 }
      }
      byRound[match.round_number].total += 1
      if (match.is_finished) {
        byRound[match.round_number].finished += 1
      }
    })

    return byRound
  }, [matchesMeta])

  // El hook devuelve el error y el aviso se muestra acá, que es donde vive el
  // toast. Sin progreso el panel no queda roto: la tarjeta de la fecha activa se
  // sigue viendo, solo sin el bloque de jugadores.
  useEffect(() => {
    if (progressError) {
      setToast({ message: 'No se pudo cargar el progreso de los jugadores', type: 'error' })
    }
  }, [progressError])

  const handleFinishRound = useCallback(
    async (roundNumber: number) => {
      const { canFinish, reason } = getFinishability(matchesByRound[roundNumber])

      if (!canFinish) {
        setToast({ message: reason, type: 'warning' })
        return
      }

      if (!confirm(`¿Finalizar ${formatRoundLabel(roundNumber)}? Se calcularán los puntajes.`)) {
        return
      }

      const { error } = await finishRound(roundNumber)
      setToast(
        error
          ? { message: `Error: ${error.message}`, type: 'error' }
          : { message: 'Fecha finalizada correctamente', type: 'success' }
      )
    },
    [matchesByRound, finishRound, formatRoundLabel]
  )

  const handleChangeStatus = useCallback(
    async (round, newStatus) => {
      if (round.status === 'finished') {
        setToast({ message: 'No se puede modificar una fecha finalizada', type: 'error' })
        return
      }

      // Dos fechas abiertas a la vez dejarían pronosticar en las dos.
      if (newStatus === 'open') {
        const openRound = rounds.find(other => other.status === 'open' && other.id !== round.id)
        if (openRound) {
          setToast({
            message: `Ya hay una fecha abierta (${getRoundDisplayName(openRound)}). Bloqueala o finalizala antes.`,
            type: 'error',
          })
          return
        }
      }

      const label = ROUND_STATUSES[newStatus]?.label ?? newStatus
      if (!confirm(`¿Cambiar estado de ${formatRoundLabel(round.round_number)} a "${label}"?`)) {
        return
      }

      const { error } = await updateRoundStatus(round.round_number, newStatus)
      setToast(
        error
          ? { message: `Error: ${error.message}`, type: 'error' }
          : { message: 'Estado actualizado', type: 'success' }
      )
    },
    [formatRoundLabel, rounds, updateRoundStatus]
  )

  if (loading) {
    return (
      <div className={styles.container}>
        <LoadingState message="Cargando fechas..." />
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <span className={styles.titleIcon} aria-hidden="true">
            📅
          </span>
          <span>Gestión de Fechas</span>
        </h2>
        <p className={styles.subtitle}>Administrá el estado de cada fecha del torneo</p>
      </div>

      {activeRound && <ActiveRoundCard round={activeRound} players={progress} />}

      <div className={styles.listCard}>
        <div className={styles.list}>
          {rounds.map(round => (
            <RoundCard
              key={round.id}
              round={round}
              matchCount={matchesByRound[round.round_number]}
              onChangeStatus={newStatus => handleChangeStatus(round, newStatus)}
              onFinish={() => handleFinishRound(round.round_number)}
            />
          ))}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
