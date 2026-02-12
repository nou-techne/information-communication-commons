// Activity Heatmap Component (GitHub-style)

import { useState } from 'react'

interface ActivityData {
  date: string // YYYY-MM-DD
  count: number
}

interface ActivityHeatmapProps {
  data: ActivityData[]
  weeks?: number
  cellSize?: number
  cellGap?: number
  colorScale?: string[]
  showLabels?: boolean
}

export function ActivityHeatmap({
  data,
  weeks = 26,
  cellSize = 12,
  cellGap = 3,
  colorScale = ['#060a14', '#1a4d1a', '#2d7a2d', '#3fa63f', '#a6ed2a'],
  showLabels = true,
}: ActivityHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<{ date: string; count: number } | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  // Create a map of date -> count
  const dataMap = new Map<string, number>()
  data.forEach(d => dataMap.set(d.date, d.count))

  // Calculate max count for color scaling
  const maxCount = Math.max(...data.map(d => d.count), 1)

  // Generate date grid (7 rows × weeks columns)
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - weeks * 7)

  const grid: Array<{ date: string; count: number; weekIndex: number; dayIndex: number }> = []

  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < 7; d++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + w * 7 + d)
      const dateStr = date.toISOString().split('T')[0]
      const count = dataMap.get(dateStr) || 0

      grid.push({
        date: dateStr,
        count,
        weekIndex: w,
        dayIndex: d,
      })
    }
  }

  // Get color for cell based on count
  function getCellColor(count: number): string {
    if (count === 0) return colorScale[0]
    const ratio = count / maxCount
    const index = Math.min(Math.ceil(ratio * (colorScale.length - 1)), colorScale.length - 1)
    return colorScale[index]
  }

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const labelWidth = showLabels ? 30 : 0
  const width = labelWidth + weeks * (cellSize + cellGap)
  const height = 7 * (cellSize + cellGap) + (showLabels ? 20 : 0)

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="relative">
      <svg
        width={width}
        height={height}
        className="activity-heatmap"
        onMouseLeave={() => setHoveredCell(null)}
      >
        {/* Day labels */}
        {showLabels &&
          dayLabels.map((label, i) => (
            <text
              key={i}
              x={labelWidth - 5}
              y={i * (cellSize + cellGap) + cellSize / 2 + 3}
              textAnchor="end"
              className="text-xs fill-gray-500"
            >
              {label}
            </text>
          ))}

        {/* Cells */}
        {grid.map((cell, i) => (
          <rect
            key={i}
            x={labelWidth + cell.weekIndex * (cellSize + cellGap)}
            y={cell.dayIndex * (cellSize + cellGap)}
            width={cellSize}
            height={cellSize}
            rx="2"
            fill={getCellColor(cell.count)}
            stroke="#060a14"
            strokeWidth="1"
            className="cursor-pointer transition-opacity hover:opacity-80"
            onMouseEnter={e => {
              setHoveredCell({ date: cell.date, count: cell.count })
              setMousePos({ x: e.clientX, y: e.clientY })
            }}
            onMouseMove={e => {
              setMousePos({ x: e.clientX, y: e.clientY })
            }}
          />
        ))}

        {/* Legend */}
        {showLabels && (
          <g transform={`translate(${labelWidth}, ${7 * (cellSize + cellGap) + 10})`}>
            <text x="0" y="8" className="text-xs fill-gray-500">
              Less
            </text>
            {colorScale.map((color, i) => (
              <rect
                key={i}
                x={30 + i * (cellSize + cellGap)}
                y="0"
                width={cellSize}
                height={cellSize}
                rx="2"
                fill={color}
                stroke="#060a14"
                strokeWidth="1"
              />
            ))}
            <text x={30 + colorScale.length * (cellSize + cellGap) + 5} y="8" className="text-xs fill-gray-500">
              More
            </text>
          </g>
        )}
      </svg>

      {/* Tooltip */}
      {hoveredCell && (
        <div
          className="fixed z-50 bg-black border border-gray-700 rounded px-2 py-1 text-xs text-white pointer-events-none"
          style={{
            left: mousePos.x + 10,
            top: mousePos.y + 10,
          }}
        >
          <div className="font-medium">{formatDate(hoveredCell.date)}</div>
          <div className="text-gray-400">
            {hoveredCell.count} {hoveredCell.count === 1 ? 'contribution' : 'contributions'}
          </div>
        </div>
      )}
    </div>
  )
}
