// SeedReveal — recovery phrase grid with tap-to-reveal overlay. Composes: SeedGrid, Icon.
// From be-onboarding.jsx SeedScreenBE.
function SeedReveal({ words, shown, onReveal }) {
  return (
    <div style={{ position: 'relative', marginTop: 18 }}>
      <SeedGrid
        words={words}
        hidden={!shown}
      />
      {!shown && (
        <div
          onClick={onReveal}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            cursor: 'pointer',
          }}
        >
          <Icon
            name="eye"
            size={22}
            color="var(--text-0)"
          />
          <span style={{ fontSize: 12, fontWeight: 600 }}>Tap to reveal</span>
          <span className="hint">Make sure nobody is watching your screen</span>
        </div>
      )}
    </div>
  )
}

Object.assign(window, { SeedReveal })
