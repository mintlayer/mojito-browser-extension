// MojitoLogo — brand mark (geometric M with orbit). Basic: pure SVG.
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

Object.assign(window, { MojitoLogo })
