// Mojito onboarding demo — shared primitives
const { useState: useStateC, useEffect: useEffectC } = React

function OnbHeader({ api, step, total = 4 }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 20px 0',
        position: 'relative',
        zIndex: 5,
        flexShrink: 0,
      }}
    >
      <button
        className="onb-back"
        onClick={() => api.pop()}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--text-1)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 18l-6-6 6-6"></path>
        </svg>
      </button>
      {step ? (
        <React.Fragment>
          <div style={{ flex: 1, display: 'flex', gap: 4 }}>
            {Array.from({ length: total }, (_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 3,
                  borderRadius: 999,
                  background: i < step ? 'var(--amber)' : 'oklch(1 0 0 / 0.07)',
                  boxShadow: i === step - 1 ? '0 0 8px var(--amber)' : 'none',
                  transition: 'all 300ms ease',
                }}
              ></div>
            ))}
          </div>
          <span
            className="mono"
            style={{ fontSize: 11, color: 'var(--text-3)' }}
          >
            {step}/{total}
          </span>
        </React.Fragment>
      ) : (
        <div style={{ flex: 1 }}></div>
      )}
    </div>
  )
}

function PinDots({ value, error }) {
  return (
    <div className={error ? 'pin-dots shake' : 'pin-dots'}>
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          className="pin-dot"
          style={{
            background:
              i < value.length
                ? error
                  ? 'var(--red)'
                  : 'var(--amber)'
                : 'transparent',
            borderColor: error
              ? 'var(--red)'
              : i < value.length
                ? 'var(--amber)'
                : 'var(--line)',
            boxShadow:
              i < value.length && !error
                ? '0 0 10px oklch(0.82 0.16 70 / 0.45)'
                : 'none',
          }}
        ></div>
      ))}
    </div>
  )
}

function Keypad({ onKey, onDel, corner, disabled }) {
  return (
    <div
      className="kp"
      style={{
        opacity: disabled ? 0.35 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
      }}
    >
      {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((k) => (
        <button
          key={k}
          className="kp-key"
          onClick={() => onKey(k)}
        >
          {k}
        </button>
      ))}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {corner || null}
      </div>
      <button
        className="kp-key"
        onClick={() => onKey('0')}
      >
        0
      </button>
      <button
        className="kp-key kp-del"
        onClick={onDel}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 4H8l-7 8 7 8h13a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1z"></path>
          <path d="M18 9l-6 6M12 9l6 6"></path>
        </svg>
      </button>
    </div>
  )
}

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

function BioGlyph({ bio, size = 24, color, stroke = 1.4 }) {
  return bio === 'face' ? (
    <FaceIcon
      size={size}
      color={color}
      stroke={stroke}
    ></FaceIcon>
  ) : (
    <Icon
      name="fingerprint"
      size={size}
      color={color}
      stroke={stroke}
    ></Icon>
  )
}

// phase: idle | scan | ok
function useBioScan(onDone) {
  const [phase, setPhase] = useStateC('idle')
  const start = () => {
    if (phase !== 'idle') return
    setPhase('scan')
    setTimeout(() => {
      setPhase('ok')
      setTimeout(onDone, 500)
    }, 1400)
  }
  return { phase, start }
}

function BioCircle({ bio, phase, onClick }) {
  const ok = phase === 'ok'
  const c = ok ? 'var(--green)' : 'var(--amber)'
  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        width: 110,
        height: 110,
        margin: '0 auto',
        cursor: 'pointer',
      }}
    >
      {phase === 'scan' &&
        [0, 0.45, 0.9].map((d, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '1px solid oklch(0.82 0.16 70 / 0.5)',
              animation: `pulse-ring 1.4s ${d}s ease-out infinite`,
            }}
          ></div>
        ))}
      <div
        style={{
          width: 110,
          height: 110,
          borderRadius: '50%',
          background: 'oklch(0.82 0.16 70 / 0.08)',
          border: `1.5px solid ${c}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 300ms ease',
          boxShadow: ok
            ? '0 0 28px oklch(0.78 0.16 150 / 0.45)'
            : '0 0 24px oklch(0.82 0.16 70 / 0.28)',
        }}
      >
        {ok ? (
          <span
            style={{ color: 'var(--green)', fontSize: 42, fontWeight: 700 }}
          >
            ✓
          </span>
        ) : (
          <BioGlyph
            bio={bio}
            size={52}
            color={c}
            stroke={1.3}
          ></BioGlyph>
        )}
      </div>
    </div>
  )
}

function Sheet({ open, onClose, label, children }) {
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
          background: 'var(--bg-1)',
          borderTop: '1px solid var(--line-soft)',
          borderRadius: '24px 24px 0 0',
          padding: '12px 22px 34px',
          animation: 'sheet-up 280ms cubic-bezier(.2,1,.4,1) forwards',
        }}
      >
        <div
          style={{
            width: 40,
            height: 4,
            borderRadius: 999,
            background: 'var(--line)',
            margin: '0 auto 16px',
          }}
        ></div>
        {children}
      </div>
    </div>
  )
}

function OnbCheck({ checked, onToggle, label }) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: 'flex',
        gap: 11,
        alignItems: 'center',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        textAlign: 'left',
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: 7,
          flexShrink: 0,
          background: checked ? 'var(--amber)' : 'transparent',
          border: '1.5px solid',
          borderColor: checked ? 'var(--amber)' : 'var(--line)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#1a1208',
          fontSize: 13,
          fontWeight: 700,
          transition: 'all 150ms ease',
        }}
      >
        {checked ? '✓' : ''}
      </div>
      <span style={{ fontSize: 13, color: 'var(--text-1)', fontWeight: 500 }}>
        {label}
      </span>
    </button>
  )
}

Object.assign(window, {
  OnbHeader,
  PinDots,
  Keypad,
  FaceIcon,
  BioGlyph,
  useBioScan,
  BioCircle,
  Sheet,
  OnbCheck,
})
