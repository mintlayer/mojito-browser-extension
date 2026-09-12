interface SparklineProps {
  data: number[]
  color?: string
  width?: number
  height?: number
  // Stretch to the container width instead of the fixed `width` — needed for
  // full-width chart cards in the narrow side panel.
  responsive?: boolean
}

// Tiny inline line chart from the design system. Pure SVG, no chart lib.
const Sparkline = ({
  data,
  color = 'var(--be-amber)',
  width = 70,
  height = 28,
  responsive = false,
}: SparklineProps) => {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pts = data
    .map(
      (v, i) =>
        `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`,
    )
    .join(' ')
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={responsive ? '100%' : width}
      height={height}
      preserveAspectRatio={responsive ? 'none' : undefined}
      style={{ overflow: 'visible', flexShrink: 0, display: 'block' }}
      data-testid="sparkline"
    >
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect={responsive ? 'non-scaling-stroke' : undefined}
      />
    </svg>
  )
}

export default Sparkline
