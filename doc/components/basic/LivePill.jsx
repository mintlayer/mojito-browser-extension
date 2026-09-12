// LivePill — small +/- change pill. Basic: no dependencies.
function LivePill({ value, suffix = '%' }) {
  const positive = value >= 0
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 7px',
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 600,
        color: positive ? 'var(--green)' : 'var(--red)',
        background: positive
          ? 'oklch(0.78 0.16 150 / 0.12)'
          : 'oklch(0.7 0.2 25 / 0.12)',
      }}
      className="mono"
    >
      <span>{positive ? '▲' : '▼'}</span>
      {Math.abs(value).toFixed(2)}
      {suffix}
    </span>
  )
}

Object.assign(window, { LivePill })
