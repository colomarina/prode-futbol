import { useState } from 'react'
import { getRoundDisplayNameByNumber } from '../../../utils/roundLabels'
import type { Round } from '../../../types/domain'
import type { RoundPoints } from '../../../utils/stats'
import styles from './LineChart.module.css'

interface LineChartProps {
  /** Una serie por fecha. El campo `points` lleva puntos o posición, según el uso. */
  data?: RoundPoints[] | null
  rounds?: Round[]
  yLabel?: string
  unit?: string
  /** La posición 1 va arriba: en ese gráfico el eje se invierte. */
  invertYAxis?: boolean
}

const LineChart = ({
  data,
  rounds = [],
  yLabel = 'Puntos',
  unit = 'pts',
  invertYAxis = false,
}: LineChartProps) => {
  const [hoveredRound, setHoveredRound] = useState<number | null>(null)
  const [selectedRound, setSelectedRound] = useState<number | null>(null)

  if (!data || data.length === 0) return null

  const isTouchDevice = typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches

  const padding = { top: 40, right: 40, bottom: 60, left: 60 }
  const baseWidth = 360
  const pointSpacing = 88
  const width = Math.max(baseWidth, padding.left + padding.right + (data.length - 1) * pointSpacing)
  const height = 300
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const values = data.map(d => d.points)
  const maxPoints = Math.max(...values)
  const minPoints = Math.min(...values)
  const range = maxPoints - minPoints || 10
  const paddingValue = range * 0.1

  const maxY = maxPoints + paddingValue
  const minY = Math.min(0, minPoints - paddingValue)

  const getX = (index: number): number => {
    if (data.length === 1) return padding.left + chartWidth / 2
    return padding.left + (index / (data.length - 1)) * chartWidth
  }

  const getY = (points: number): number => {
    const ratio = (points - minY) / (maxY - minY)
    if (invertYAxis) {
      return padding.top + ratio * chartHeight
    }
    return height - padding.bottom - ratio * chartHeight
  }

  const activeRound = selectedRound ?? hoveredRound

  const getTooltipX = (x: number): number => {
    const tooltipWidth = 100
    const minX = padding.left + 4
    const maxX = width - padding.right - tooltipWidth - 4
    return Math.min(Math.max(x - tooltipWidth / 2, minX), maxX)
  }

  // Generar path de linea
  const pathData = data
    .map((d, i) => {
      const x = getX(i)
      const y = getY(d.points)
      return `${i === 0 ? 'M' : 'L'}${x},${y}`
    })
    .join(' ')

  // Generar ticks de ejes
  const yTicks: { value: number; y: number }[] = []
  const tickCount = 5
  for (let i = 0; i <= tickCount; i++) {
    const value = minY + ((maxY - minY) / tickCount) * i
    yTicks.push({
      value: Math.round(value),
      y: getY(value),
    })
  }

  return (
    <div className={styles.container}>
      <p className={styles.hint}>{isTouchDevice ? 'Toca un punto para ver detalle' : ''}</p>
      <div className={styles.scrollArea}>
        <svg
          width={width}
          height="100%"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMinYMid meet"
          className={styles.chart}
        >
          {/* Grid de fondo */}
          {yTicks.map((tick, i) => (
            <g key={`grid-${i}`}>
              <line
                x1={padding.left}
                y1={tick.y}
                x2={width - padding.right}
                y2={tick.y}
                className={styles.gridLine}
              />
              <text
                x={padding.left - 10}
                y={tick.y}
                textAnchor="end"
                dominantBaseline="middle"
                className={styles.axisLabel}
              >
                {tick.value}
              </text>
            </g>
          ))}

          {/* Linea del grafico */}
          <path d={pathData} className={styles.line} />

          {/* Puntos interactivos */}
          {data.map((d, i) => {
            const x = getX(i)
            const y = getY(d.points)
            const isActive = activeRound === d.roundNumber
            const tooltipX = getTooltipX(x)

            return (
              <g
                key={`point-${i}`}
                onPointerEnter={() => {
                  if (!isTouchDevice) setHoveredRound(d.roundNumber)
                }}
                onPointerLeave={() => {
                  if (!isTouchDevice) setHoveredRound(null)
                }}
                onClick={() => {
                  setSelectedRound(prev => (prev === d.roundNumber ? null : d.roundNumber))
                }}
                className={styles.pointGroup}
              >
                {/* Circulo grande (hit area) */}
                <circle cx={x} cy={y} r={isTouchDevice ? 14 : 10} className={styles.pointHitArea} />

                {/* Circulo visible */}
                <circle
                  cx={x}
                  cy={y}
                  r={isActive ? 6 : 4}
                  className={styles.point}
                  style={{
                    transition: 'r 0.2s',
                  }}
                />

                {/* Tooltip */}
                {isActive && (
                  <>
                    {/* Linea vertical */}
                    <line
                      x1={x}
                      y1={padding.top}
                      x2={x}
                      y2={height - padding.bottom}
                      className={styles.tooltipLine}
                    />

                    {/* Tooltip box */}
                    <rect
                      x={tooltipX}
                      y={y - 45}
                      width="100"
                      height="40"
                      rx="4"
                      className={styles.tooltipBox}
                    />
                    <text
                      x={tooltipX + 50}
                      y={y - 30}
                      textAnchor="middle"
                      className={styles.tooltipText}
                    >
                      {getRoundDisplayNameByNumber(d.roundNumber, rounds)}
                    </text>
                    <text
                      x={tooltipX + 50}
                      y={y - 15}
                      textAnchor="middle"
                      className={styles.tooltipValue}
                    >
                      {d.points} {unit}
                    </text>
                  </>
                )}

                {/* Etiqueta de round en el eje X */}
                <text
                  x={x}
                  y={height - padding.bottom + 25}
                  textAnchor="middle"
                  className={styles.axisLabel}
                >
                  {getRoundDisplayNameByNumber(d.roundNumber, rounds)}
                </text>
              </g>
            )
          })}

          {/* Ejes */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={height - padding.bottom}
            className={styles.axis}
          />
          <line
            x1={padding.left}
            y1={height - padding.bottom}
            x2={width - padding.right}
            y2={height - padding.bottom}
            className={styles.axis}
          />

          {/* Etiquetas de ejes */}
          <text x={padding.left - 35} y={padding.top - 10} className={styles.axisTitle}>
            {yLabel}
          </text>
          <text x={width / 2} y={height - 15} textAnchor="middle" className={styles.axisTitle}>
            Número de Fecha
          </text>
        </svg>
      </div>
    </div>
  )
}

export default LineChart
