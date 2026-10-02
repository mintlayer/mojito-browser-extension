// Sparkline — tiny line chart. Basic: pure SVG.
function Sparkline({ data, color = 'var(--amber)', width = 70, height = 28 }) {
  const min = Math.min(...data),
    max = Math.max(...data)
  const range = max - min || 1
  const pts = data
    .map(
      (v, i) =>
        `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`,
    )
    .join(' ')
  return (
    <svg
      width={width}
      height={height}
      style={{ overflow: 'visible' }}
    >
      <polyline
        className="spark"
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

Object.assign(window, { Sparkline })
