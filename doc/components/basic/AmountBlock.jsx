// AmountBlock — big centered amount with symbol and optional USD line. Basic: no dependencies.
// Extracted from Send review, dApp tx/delegate review and the Asset screen header.
function AmountBlock({ label, amount, sym, usd, size = 30 }) {
  return (
    <div style={{ textAlign: 'center', padding: '18px 0 4px' }}>
      {label && <div className="eyebrow">{label}</div>}
      <div
        className="tnum"
        style={{
          fontSize: size,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          marginTop: label ? 4 : 0,
        }}
      >
        {amount}{' '}
        <span
          style={{
            fontSize: size * 0.5,
            color: 'var(--text-2)',
            fontWeight: 500,
          }}
        >
          {sym}
        </span>
      </div>
      {usd != null && (
        <div
          className="mono"
          style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}
        >
          ≈ {usd}
        </div>
      )}
    </div>
  )
}

Object.assign(window, { AmountBlock })
