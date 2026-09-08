import styles from './MojitoLogo.module.css'

interface MojitoLogoProps {
  size?: number
  animate?: boolean
}

const MojitoLogo = ({ size = 48, animate = true }: MojitoLogoProps) => {
  const gradientId = `be-logo-amber-${size}`
  const gradientIdTeal = `be-logo-teal-${size}`
  return (
    <div
      style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}
    >
      <svg
        viewBox="0 0 64 64"
        width={size}
        height={size}
        data-testid="mojito-logo"
      >
        <defs>
          <linearGradient
            id={gradientId}
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
            id={gradientIdTeal}
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
          stroke={`url(#${gradientId})`}
          strokeWidth="1.2"
          opacity="0.6"
        />
        <path
          d="M16 46 L16 18 L32 36 L48 18 L48 46"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="3.2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path
          d="M22 46 L22 28 L32 38 L42 28 L42 46"
          fill="none"
          stroke={`url(#${gradientIdTeal})`}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity="0.85"
        />
        <circle
          cx="32"
          cy="36"
          r="2.4"
          fill={`url(#${gradientId})`}
        />
      </svg>
      {animate && <div className={styles.orbit} />}
    </div>
  )
}

export default MojitoLogo
