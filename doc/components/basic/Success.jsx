// Success — success burst with pulsing rings. Basic: no dependencies.
function Success({ title, sub, children }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '28px 0 0',
        animation: 'fade-in 400ms ease both',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: 84,
          height: 84,
          margin: '0 auto',
        }}
      >
        {[0, 0.3].map((d, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '1px solid oklch(0.78 0.16 150 / 0.6)',
              animation: `pulse-ring 1.6s ${d}s ease-out infinite`,
            }}
          ></div>
        ))}
        <div
          style={{
            width: 84,
            height: 84,
            borderRadius: '50%',
            background: 'oklch(0.78 0.16 150 / 0.18)',
            border: '1.5px solid var(--green)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--green)',
            fontSize: 36,
            fontWeight: 700,
            boxShadow: '0 0 32px oklch(0.78 0.16 150 / 0.4)',
          }}
        >
          ✓
        </div>
      </div>
      <div style={{ fontSize: 21, fontWeight: 700, marginTop: 18 }}>
        {title}
      </div>
      {sub && (
        <div
          className="mono"
          style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 5 }}
        >
          {sub}
        </div>
      )}
      {children}
    </div>
  )
}

Object.assign(window, { Success })
