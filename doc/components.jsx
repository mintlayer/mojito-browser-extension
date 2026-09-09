// Mojito Wallet — shared components

const { useState, useEffect, useRef, useMemo } = React

// ─── Logo (geometric M with orbit) ───────────────────────────
function MojitoLogo({ size = 48, animate = true }) {
  return (
    <div
      className="logo-mark"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 64 64"
        width={size}
        height={size}
      >
        <defs>
          <linearGradient
            id="lg-amber"
            x1="0"
            y1="0"
            x2="1"
            y2="1"
          >
            <stop
              offset="0%"
              stopColor="oklch(0.86 0.16 70)"
            />
            <stop
              offset="100%"
              stopColor="oklch(0.7 0.17 60)"
            />
          </linearGradient>
          <linearGradient
            id="lg-teal"
            x1="0"
            y1="1"
            x2="1"
            y2="0"
          >
            <stop
              offset="0%"
              stopColor="oklch(0.82 0.12 195)"
            />
            <stop
              offset="100%"
              stopColor="oklch(0.74 0.16 290)"
            />
          </linearGradient>
        </defs>
        <circle
          cx="32"
          cy="32"
          r="30"
          fill="oklch(0.18 0.014 60)"
          stroke="url(#lg-amber)"
          strokeWidth="1.2"
          opacity="0.6"
        />
        {/* M shape from triangles */}
        <path
          d="M16 46 L16 18 L32 36 L48 18 L48 46"
          fill="none"
          stroke="url(#lg-amber)"
          strokeWidth="3.2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path
          d="M22 46 L22 28 L32 38 L42 28 L42 46"
          fill="none"
          stroke="url(#lg-teal)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity="0.85"
        />
        <circle
          cx="32"
          cy="36"
          r="2.4"
          fill="url(#lg-amber)"
        />
      </svg>
      {animate && (
        <div
          style={{
            position: 'absolute',
            inset: -4,
            borderRadius: '50%',
            border: '1px dashed oklch(0.82 0.16 70 / 0.35)',
            animation: 'spin-slow 18s linear infinite',
          }}
        />
      )}
    </div>
  )
}

// ─── Animated counter ────────────────────────────────────────
function Counter({
  value,
  decimals = 2,
  prefix = '',
  suffix = '',
  duration = 1200,
}) {
  const [v, setV] = useState(0)
  useEffect(() => {
    let start = performance.now()
    let raf
    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setV(value * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])
  return (
    <span className="tnum">
      {prefix}
      {v.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  )
}

// ─── Live ticker (small +/- pill) ────────────────────────────
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

// ─── Token icon (procedural) ─────────────────────────────────
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

// ─── Chain badge (small) ─────────────────────────────────────
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

// ─── Sparkline ───────────────────────────────────────────────
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

// ─── Icon library (line) ─────────────────────────────────────
function Icon({ name, size = 20, color = 'currentColor', stroke = 1.6 }) {
  const paths = {
    home: (
      <>
        <path d="M3 11l9-8 9 8" />
        <path d="M5 9v12h14V9" />
      </>
    ),
    swap: (
      <>
        <path d="M4 7h13l-3-3" />
        <path d="M20 17H7l3 3" />
      </>
    ),
    bridge: (
      <>
        <path d="M3 12c3 0 4-4 9-4s6 4 9 4" />
        <path d="M3 17h18" />
        <path d="M7 17v-3M11 17v-4M15 17v-4M19 17v-3" />
      </>
    ),
    chart: (
      <>
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="M8 15l3-3 3 2 5-6" />
      </>
    ),
    settings: (
      <>
        <circle
          cx="12"
          cy="12"
          r="3"
        />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
      </>
    ),
    arrow_up: (
      <>
        <path d="M12 19V5" />
        <path d="M5 12l7-7 7 7" />
      </>
    ),
    arrow_dn: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12l7 7 7-7" />
      </>
    ),
    arrow_r: (
      <>
        <path d="M5 12h14" />
        <path d="M12 5l7 7-7 7" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    qr: (
      <>
        <rect
          x="3"
          y="3"
          width="7"
          height="7"
        />
        <rect
          x="14"
          y="3"
          width="7"
          height="7"
        />
        <rect
          x="3"
          y="14"
          width="7"
          height="7"
        />
        <path d="M14 14h3v3h-3z" />
        <path d="M20 14v3" />
        <path d="M14 20h7" />
      </>
    ),
    scan: (
      <>
        <path d="M4 7V5a1 1 0 0 1 1-1h2" />
        <path d="M17 4h2a1 1 0 0 1 1 1v2" />
        <path d="M20 17v2a1 1 0 0 1-1 1h-2" />
        <path d="M7 20H5a1 1 0 0 1-1-1v-2" />
        <path d="M4 12h16" />
      </>
    ),
    bell: (
      <>
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10 21a2 2 0 0 0 4 0" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3l8 3v6c0 4-3 8-8 9-5-1-8-5-8-9V6z" />
        <path d="M9 12l2 2 4-4" />
      </>
    ),
    flash: (
      <>
        <path d="M13 2L4 14h7l-1 8 9-12h-7z" />
      </>
    ),
    history: (
      <>
        <path d="M3 12a9 9 0 1 0 3-7" />
        <path d="M3 4v5h5" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8S2 12 2 12z" />
        <circle
          cx="12"
          cy="12"
          r="3"
        />
      </>
    ),
    eye_off: (
      <>
        <path d="M9.9 4.2A10 10 0 0 1 22 12s-1 2-3 4" />
        <path d="M6 6c-2 1.5-4 6-4 6s4 8 10 8a10 10 0 0 0 6-2" />
        <path d="M3 3l18 18" />
      </>
    ),
    lock: (
      <>
        <rect
          x="4"
          y="11"
          width="16"
          height="10"
          rx="2"
        />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </>
    ),
    fingerprint: (
      <>
        <path d="M12 2a10 10 0 0 0-10 10" />
        <path d="M22 12a10 10 0 0 0-10-10" />
        <path d="M7 12a5 5 0 0 1 10 0v3a3 3 0 0 1-6 0" />
        <path d="M12 12v6" />
      </>
    ),
    chevron_r: (
      <>
        <path d="M9 18l6-6-6-6" />
      </>
    ),
    card: (
      <>
        <rect
          x="2"
          y="5"
          width="20"
          height="14"
          rx="2"
        />
        <path d="M2 10h20" />
        <path d="M6 15h4" />
      </>
    ),
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      {paths[name] || null}
    </svg>
  )
}

// ─── Status bar ──────────────────────────────────────────────
function StatusBar() {
  return (
    <div
      style={{
        height: 52,
        padding: '18px 28px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontFamily: 'Inter',
        color: 'var(--text-0)',
        fontSize: 15,
        fontWeight: 600,
        position: 'relative',
        zIndex: 5,
      }}
    >
      <span>9:41</span>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <svg
          width="17"
          height="11"
          viewBox="0 0 17 11"
          fill="none"
        >
          <rect
            x="0"
            y="7"
            width="3"
            height="4"
            rx="0.6"
            fill="currentColor"
          />
          <rect
            x="4.5"
            y="5"
            width="3"
            height="6"
            rx="0.6"
            fill="currentColor"
          />
          <rect
            x="9"
            y="2.5"
            width="3"
            height="8.5"
            rx="0.6"
            fill="currentColor"
          />
          <rect
            x="13.5"
            y="0"
            width="3"
            height="11"
            rx="0.6"
            fill="currentColor"
          />
        </svg>
        <svg
          width="15"
          height="11"
          viewBox="0 0 15 11"
          fill="none"
        >
          <path
            d="M7.5 3a7 7 0 0 1 5.5 2.5L12 6.5A5.5 5.5 0 0 0 3 6.5L2 5.5A7 7 0 0 1 7.5 3z"
            fill="currentColor"
          />
          <circle
            cx="7.5"
            cy="9"
            r="1.3"
            fill="currentColor"
          />
        </svg>
        <svg
          width="25"
          height="12"
          viewBox="0 0 25 12"
          fill="none"
        >
          <rect
            x="0.5"
            y="0.5"
            width="22"
            height="11"
            rx="3"
            stroke="currentColor"
            opacity="0.5"
          />
          <rect
            x="2"
            y="2"
            width="18"
            height="8"
            rx="1.5"
            fill="currentColor"
          />
          <rect
            x="23"
            y="4"
            width="1.5"
            height="4"
            rx="0.5"
            fill="currentColor"
            opacity="0.5"
          />
        </svg>
      </div>
    </div>
  )
}

Object.assign(window, {
  MojitoLogo,
  Counter,
  LivePill,
  TokenIcon,
  ChainBadge,
  Sparkline,
  Icon,
  StatusBar,
})
