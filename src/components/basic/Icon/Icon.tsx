import { ReactElement } from 'react'

interface IconProps {
  name: string
  size?: number
  color?: string
  stroke?: number
  className?: string
}

// Line icon set from the design system (doc/ components.jsx).
const paths: Record<string, ReactElement> = {
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
  chart: (
    <>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 15l3-3 3 2 5-6" />
    </>
  ),
  stake: (
    <>
      <path d="M6 21v-3" />
      <path d="M6 3v15" />
      <path d="M6 4h11l-3 3.5L17 11H6" />
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
  shield: (
    <>
      <path d="M12 3l8 3v6c0 4-3 8-8 9-5-1-8-5-8-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  flash: <path d="M13 2L4 14h7l-1 8 9-12h-7z" />,
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
  chevron_r: <path d="M9 18l6-6-6-6" />,
  chevron_l: <path d="M15 18l-6-6 6-6" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
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

const Icon = ({
  name,
  size = 20,
  color = 'currentColor',
  stroke = 1.6,
  className,
}: IconProps) => {
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
      className={className}
      data-testid={`icon-${name}`}
    >
      {paths[name] || null}
    </svg>
  )
}

export default Icon
