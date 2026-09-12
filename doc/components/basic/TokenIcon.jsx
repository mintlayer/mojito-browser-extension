// TokenIcon — procedural token icon. Basic: no dependencies.
function TokenIcon({ symbol, size = 36 }) {
  const map = {
    BTC: { c1: 'oklch(0.82 0.16 70)', c2: 'oklch(0.7 0.17 50)', g: '₿' },
    ML: { c1: 'oklch(0.82 0.12 195)', c2: 'oklch(0.7 0.14 210)', g: 'Ⓜ' },
    ETH: { c1: 'oklch(0.74 0.06 280)', c2: 'oklch(0.55 0.08 280)', g: 'Ξ' },
    USDT: { c1: 'oklch(0.78 0.13 160)', c2: 'oklch(0.6 0.12 160)', g: '₮' },
    USDC: { c1: 'oklch(0.7 0.13 240)', c2: 'oklch(0.55 0.14 250)', g: '$' },
    MATIC: { c1: 'oklch(0.7 0.18 290)', c2: 'oklch(0.55 0.18 290)', g: '◆' },
    BNB: { c1: 'oklch(0.85 0.15 90)', c2: 'oklch(0.7 0.16 80)', g: '◈' },
    ARB: { c1: 'oklch(0.7 0.13 230)', c2: 'oklch(0.55 0.14 230)', g: '◉' },
    OP: { c1: 'oklch(0.7 0.2 25)', c2: 'oklch(0.55 0.2 20)', g: '○' },
  }
  const t = map[symbol] || {
    c1: 'oklch(0.6 0.05 60)',
    c2: 'oklch(0.4 0.05 60)',
    g: symbol[0],
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${t.c1}, ${t.c2})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#0b0a09',
        fontWeight: 700,
        fontSize: size * 0.42,
        boxShadow: `0 4px 14px -4px ${t.c1}, inset 0 1px 0 oklch(1 0 0 / 0.3)`,
        flexShrink: 0,
      }}
    >
      {t.g}
    </div>
  )
}

Object.assign(window, { TokenIcon })
