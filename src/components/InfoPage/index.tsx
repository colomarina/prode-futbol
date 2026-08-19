import PointsSystemSection from './PointsSystemSection'
import TiebreakSection from './TiebreakSection'
import MatchStatusSection from './MatchStatusSection'
import PageHeader from './PageHeader'
import styles from './InfoPage.module.css'

/** Las tres secciones de Reglas. Salen de `pages-with-sections.config`. */
export type InfoSection = 'points' | 'tiebreaks' | 'match-status'

export default function InfoPage({
  activeSection = 'points',
}: {
  activeSection?: InfoSection | string
}) {
  const renderSection = () => {
    switch (activeSection) {
      case 'points':
        return <PointsSystemSection />
      case 'tiebreaks':
        return <TiebreakSection />
      case 'match-status':
        return <MatchStatusSection />
      default:
        return <PointsSystemSection />
    }
  }

  return (
    <div className="container" style={{ maxWidth: '1200px' }}>
      <PageHeader icon="ℹ️" title="Información del Torneo" />

      {/* NavTabs se muestra arriba en Navigation */}

      {/* Contenido de la sección activa */}
      <div className={styles.sectionContent}>{renderSection()}</div>
    </div>
  )
}
