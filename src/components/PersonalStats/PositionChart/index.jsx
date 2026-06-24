import { LineChart } from '../LineChart'

export const PositionChart = ({ data, rounds }) => {
  return <LineChart data={data} rounds={rounds} yLabel="Posición" unit="posición" invertYAxis />
}
