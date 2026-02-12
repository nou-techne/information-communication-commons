// Dimension Radar Chart Component

interface DimensionRadarProps {
  data: {
    human: number
    language: number
    artifact: number
    methodology: number
    training: number
  }
  size?: number
  color?: string
  maxValue?: number
  showLabels?: boolean
  showGrid?: boolean
}

export function DimensionRadar({
  data,
  size = 200,
  color = '#a6ed2a',
  maxValue = 100,
  showLabels = true,
  showGrid = true,
}: DimensionRadarProps) {
  const center = size / 2
  const radius = (size / 2) * 0.8
  const dimensions = [
    { key: 'human', label: 'H', angle: -90 },
    { key: 'language', label: 'L', angle: -18 },
    { key: 'artifact', label: 'A', angle: 54 },
    { key: 'methodology', label: 'M', angle: 126 },
    { key: 'training', label: 'T', angle: 198 },
  ] as const

  // Calculate polygon points
  const points = dimensions.map(dim => {
    const value = data[dim.key] || 0
    const normalizedValue = Math.min(value / maxValue, 1)
    const r = radius * normalizedValue
    const angleRad = (dim.angle * Math.PI) / 180
    return {
      x: center + r * Math.cos(angleRad),
      y: center + r * Math.sin(angleRad),
      label: dim.label,
      labelX: center + (radius + 20) * Math.cos(angleRad),
      labelY: center + (radius + 20) * Math.sin(angleRad),
      value: value,
      angle: dim.angle,
    }
  })

  const polygonPath = points.map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`)).join(' ') + ' Z'

  // Grid circles (25%, 50%, 75%, 100%)
  const gridLevels = [0.25, 0.5, 0.75, 1.0]

  return (
    <svg width={size} height={size} className="dimension-radar">
      {/* Background grid */}
      {showGrid && (
        <g opacity="0.3">
          {gridLevels.map((level, i) => (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={radius * level}
              fill="none"
              stroke="#333"
              strokeWidth="1"
            />
          ))}

          {/* Axis lines */}
          {dimensions.map((dim, i) => {
            const angleRad = (dim.angle * Math.PI) / 180
            const x = center + radius * Math.cos(angleRad)
            const y = center + radius * Math.sin(angleRad)
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="#333"
                strokeWidth="1"
              />
            )
          })}
        </g>
      )}

      {/* Data polygon */}
      <path
        d={polygonPath}
        fill={color}
        fillOpacity="0.3"
        stroke={color}
        strokeWidth="2"
      />

      {/* Data points */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="4"
          fill={color}
        />
      ))}

      {/* Labels */}
      {showLabels &&
        points.map((p, i) => (
          <g key={i}>
            <text
              x={p.labelX}
              y={p.labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-sm font-bold"
              fill="white"
            >
              {p.label}
            </text>
            <text
              x={p.labelX}
              y={p.labelY + 14}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-xs"
              fill="#999"
            >
              {p.value}
            </text>
          </g>
        ))}
    </svg>
  )
}
