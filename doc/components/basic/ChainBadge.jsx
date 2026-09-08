// ChainBadge — small chain pill with dot. Basic: no dependencies.
function ChainBadge({ chain }) {
  const map = {
    Mintlayer: { color: 'var(--teal)', bg: 'var(--teal-soft)' },
    Bitcoin: { color: 'var(--amber)', bg: 'var(--amber-soft)' },
    Ethereum: { color: 'var(--violet)', bg: 'var(--violet-soft)' },
    Arbitrum: {
      color: 'oklch(0.7 0.13 230)',
      bg: 'oklch(0.7 0.13 230 / 0.14)',
    },
    Polygon: { color: 'oklch(0.7 0.18 290)', bg: 'oklch(0.7 0.18 290 / 0.14)' },
    BNB: { color: 'oklch(0.85 0.15 90)', bg: 'oklch(0.85 0.15 90 / 0.14)' },
  }
  const t = map[chain] || { color: 'var(--text-2)', bg: 'oklch(1 0 0 / 0.05)' }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '2px 7px',
        borderRadius: 6,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.04em',
        color: t.color,
        background: t.bg,
        border: `1px solid ${t.color}`,
        borderColor: t.color + '40',
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: t.color,
        }}
      />
      {chain.toUpperCase()}
    </span>
  )
}

Object.assign(window, { ChainBadge })
