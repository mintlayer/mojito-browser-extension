// Sheet — bottom sheet primitive: overlay + panel + drag handle. Basic: no dependencies.
// Common base of BeSheet (wallet) and the onboarding Sheet.
function Sheet({
  open,
  onClose,
  label,
  children,
  maxHeight = '88%',
  padding = '10px 18px 18px',
  radius = 20,
}) {
  if (!open) return null
  return (
    <div
      style={{ position: 'absolute', inset: 0, zIndex: 60 }}
      data-screen-label={label || 'Bottom sheet'}
    >
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'oklch(0 0 0 / 0.55)',
          animation: 'fade-in 200ms ease forwards',
        }}
      ></div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          maxHeight,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-1)',
          borderTop: '1px solid var(--line-soft)',
          borderRadius: `${radius}px ${radius}px 0 0`,
          padding,
          animation: 'sheet-up 260ms cubic-bezier(.2,1,.4,1) forwards',
        }}
      >
        <div
          style={{
            width: 36,
            height: 4,
            borderRadius: 999,
            background: 'var(--line)',
            margin: '0 auto 12px',
            flexShrink: 0,
          }}
        ></div>
        {children}
      </div>
    </div>
  )
}

Object.assign(window, { Sheet })
