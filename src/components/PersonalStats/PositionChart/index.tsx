import LineChart from '../LineChart'
import type { Round } from '../../../types/domain'
import type { RoundPoints } from '../../../utils/stats'

const PositionChart = ({ data, rounds }: { data?: RoundPoints[] | null; rounds?: Round[] }) => {
  return <LineChart data={data} rounds={rounds} yLabel="Posición" unit="posición" invertYAxis />
}

export default PositionChart
