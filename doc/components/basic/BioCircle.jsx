// BioCircle — tappable biometric scan circle. Composes: BioGlyph.
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

Object.assign(window, { BioCircle })
