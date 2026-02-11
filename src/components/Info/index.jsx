import PageHeader from './PageHeader'
import PointsSystemSection from './PointsSystemSection'
import TiebreakSection from './TiebreakSection'

export default function Info() {
  return (
    <div className="container" style={{ maxWidth: '1000px' }}>
      <PageHeader
        icon="ℹ️"
        title="Información del Torneo"
        subtitle="Sistema de puntos, reglamento y desempates"
      />
      <PointsSystemSection />
      <TiebreakSection />
    </div>
  )
}
