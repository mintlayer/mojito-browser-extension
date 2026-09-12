// Broadcasting — full-screen "sending" state with spinner. Composes: Spinner.
// Extracted from DappWindow broadcasting phase; reused by account discovery.
function Broadcasting({ chain, sub = 'Do not close this window' }) {
  return (
    <div
      className="scroll pad"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <Spinner
        size={40}
        color="var(--amber)"
        width={2.5}
      />
      <div style={{ fontSize: 15, fontWeight: 600 }}>
        {chain ? `Broadcasting to ${chain}…` : 'Scanning…'}
      </div>
      <span className="hint">{sub}</span>
    </div>
  )
}

Object.assign(window, { Broadcasting })
