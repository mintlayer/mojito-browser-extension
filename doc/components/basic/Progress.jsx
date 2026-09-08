// Progress — step progress bar. Basic: no dependencies.
// Extracted from OnbHeader (onb-core) and OnbTop (be-onboarding).
function Progress({ step, total = 4 }) {
  return (
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
  )
}

Object.assign(window, { Progress })
