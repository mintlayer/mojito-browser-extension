// FeeSelector — Bitcoin fee speed picker (economy/standard/fast). Basic-level composed grid.
// From be-send.jsx SendScreenBE network-fee field.
function FeeSelector({ fees, value, onChange }) {
  return (
    <div
      style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}
    >
      {Object.entries(fees).map(([k, f]) => (
        <div
          key={k}
          onClick={() => onChange(k)}
          style={{
            padding: '10px 8px',
            borderRadius: 12,
            cursor: 'pointer',
            textAlign: 'center',
            background:
              value === k ? 'var(--amber-soft)' : 'oklch(1 0 0 / 0.03)',
            border: `1px solid ${value === k ? 'oklch(0.82 0.16 70 / 0.5)' : 'var(--line-soft)'}`,
            transition: 'all 150ms',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600 }}>{f.l}</div>
          <div
            className="mono"
            style={{ fontSize: 10, color: 'var(--text-2)', marginTop: 3 }}
          >
            {f.rate} sat/vB
          </div>
          <div
            className="hint"
            style={{ fontSize: 10 }}
          >
            {f.eta}
          </div>
        </div>
      ))}
    </div>
  )
}

Object.assign(window, { FeeSelector })
