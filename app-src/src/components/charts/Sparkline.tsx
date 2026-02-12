// Sparkline Chart Component

interface SparklineProps {
  data: number[]
  color?: string
  width?: number
  height?: number
  strokeWidth?: number
  showArea?: boolean
  showDots?: boolean
}

export function Sparkline({
  data,
  color = '#a6ed2a',
  width = 100,
  height = 30,
  strokeWidth = 2,
  showArea = false,
  showDots = false,
}: SparklineProps) {
  if (data.length === 0) {
    return (
      <svg width={width} height={height} className="sparkline">
        <line
          x1="0"
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="#333"
          strokeWidth="1"
          strokeDasharray="2,2"
        />
      </svg>
    )
  }

  if (data.length === 1) {
    return (
      <svg width={width} height={height} className="sparkline">
        <circle cx={width / 2} cy={height / 2} r="2" fill={color} />
      </svg>
    )
  }

  // Calculate min/max for scaling
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  // Map data points to coordinates
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width
    const y = height - ((value - min) / range) * height
    return { x, y, value }
  })

  // Build path for line
  const linePath = points.map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`)).join(' ')

  // Build path for area fill
  const areaPath = showArea
    ? `${linePath} L ${width},${height} L 0,${height} Z`
    : ''

  return (
    <svg width={width} height={height} className="sparkline">
      {/* Area fill */}
      {showArea && (
        <path
          d={areaPath}
          fill={color}
          fillOpacity="0.2"
        />
      )}

      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Dots at data points */}
      {showDots &&
        points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={strokeWidth}
            fill={color}
          />
        ))}

      {/* Highlight first and last points */}
      <circle cx={points[0].x} cy={points[0].y} r={strokeWidth * 0.8} fill={color} opacity="0.5" />
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r={strokeWidth * 1.2}
        fill={color}
      />
    </svg>
  )
}
