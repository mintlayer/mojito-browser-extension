// FaceIcon — Face ID style glyph. Basic: pure SVG.
function FaceIcon({ size = 24, color = 'currentColor', stroke = 1.6 }) {
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
    >
      <path d="M4 8V6a2 2 0 0 1 2-2h2"></path>
      <path d="M16 4h2a2 2 0 0 1 2 2v2"></path>
      <path d="M20 16v2a2 2 0 0 1-2 2h-2"></path>
      <path d="M8 20H6a2 2 0 0 1-2-2v-2"></path>
      <path d="M9 9.5v1.2"></path>
      <path d="M15 9.5v1.2"></path>
      <path d="M9.5 14.5s.9 1.1 2.5 1.1 2.5-1.1 2.5-1.1"></path>
    </svg>
  )
}

Object.assign(window, { FaceIcon })
