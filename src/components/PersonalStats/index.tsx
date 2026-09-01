import { useAuth } from '../../contexts/AuthContext'
import { useTournament } from '../../contexts/TournamentContext'
import { useRounds } from '../../hooks/useRounds'
import { usePersonalStats } from '../../hooks/usePersonalStats'
import LineChart from './LineChart'
import AccuracyBreakdown from './AccuracyBreakdown'
import PositionChart from './PositionChart'
import PerformanceOverview from './PerformanceOverview'
import StreakStats from './StreakStats'
import TeamStats from './TeamStats'
import PersonalRecords from './PersonalRecords'
import HistoryStats from './HistoryStats'
import AdditionalStats from './AdditionalStats'
import StatSection from './StatSection'
import LoadingState from '../Common/LoadingState'
import ErrorMessage from '../Common/ErrorMessage'
import styles from './PersonalStats.module.css'

export default function PersonalStats() {
  const { user } = useAuth()
  const { activeTournament } = useTournament()
  const { rounds } = useRounds(activeTournament?.id)
  const { stats, loading, error, fetchStats } = usePersonalStats(user?.id, activeTournament?.id)

  if (loading) {
    return (
      <div className={styles.container}>
        <LoadingState message="Cargando estadísticas..." />
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className={styles.container}>
        <div className={styles.centered}>
          <ErrorMessage error={error || 'Error cargando estadísticas'} onRetry={fetchStats} />
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Mis Estadísticas</h1>
        <p className={styles.subtitle}>Análisis detallado de tu desempeño</p>
      </div>

      <StatSection
        title="Rendimiento General"
        tooltip="Muestra tu total acumulado, posición general, promedio por fecha y precisión global."
      >
        <PerformanceOverview metrics={stats.metrics} />
      </StatSection>

      <StatSection
        title="Evolución"
        tooltip="Representa tus puntos por fecha para ver tus altibajos y fechas más fuertes."
      >
        <LineChart data={stats.evolutionByRound} rounds={rounds} />
      </StatSection>

      <StatSection
        title="Posición por Fecha"
        tooltip="Muestra tu puesto en la tabla general luego de cada fecha."
      >
        <PositionChart data={stats.positionByRound} rounds={rounds} />
      </StatSection>

      <StatSection
        title="Rachas"
        tooltip="Resumen de tus mejores y más largas rachas de puntos, pleno y top 3/top 10."
      >
        <StreakStats streaks={stats.streaks} />
      </StatSection>

      <StatSection
        title="Perfil del Pronosticador"
        tooltip="Desglose de aciertos exactos, ganador, diferencia de goles y errores."
      >
        <AccuracyBreakdown breakdown={stats.accuracyBreakdown} />
      </StatSection>

      <StatSection
        title="Equipos"
        tooltip="Resalta tus equipos favoritos según predicciones y los equipos con mejor/peor porcentaje de aciertos."
      >
        <TeamStats teamStats={stats.teamStats} />
      </StatSection>

      <StatSection
        title="Récords Personales"
        tooltip="Muestra tus mejores fechas y partidos según puntos y precisión."
      >
        <PersonalRecords
          records={{
            bestRound: stats.bestRound,
            worstRound: stats.worstRound,
            bestMatch: stats.personalRecords?.bestMatch ?? null,
            mostPreciseRound: stats.personalRecords?.mostPreciseRound ?? null,
          }}
          rounds={rounds}
        />
      </StatSection>

      <StatSection
        title="Historial"
        tooltip="Calcula podios, fechas ganadas, mejor posición y rachas de mejora por cada ronda."
      >
        <HistoryStats history={stats.history} />
      </StatSection>

      <StatSection
        title="Datos Adicionales"
        tooltip="Muestra puntaje promedio por partido, pronósticos totales y partidos analizados."
      >
        <AdditionalStats stats={stats.additionalStats} />
      </StatSection>
    </div>
  )
}
