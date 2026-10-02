// AssetRow — token list row with sparkline and 24h change. Composes: TokenIcon, Tag, Sparkline, LivePill.
// From the Home "Tokens" list.
function AssetRow({ a, hideBal = false, onClick, index = 0 }) {
  const H = (v) => (hideBal ? '••••' : v)
  return (
    <div
      className="row"
      style={{
        padding: '11px 14px',
        animation: `slide-up 400ms ${index * 50}ms ease both`,
      }}
      onClick={onClick}
    >
      <TokenIcon
        symbol={a.sym}
        size={36}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{a.sym}</span>
          {a.chain === 'Mintlayer' && a.id !== 'ml' && (
            <Tag c="teal">Token</Tag>
          )}
          {a.authority && <Tag c="violet">Issuer</Tag>}
        </div>
        <div
          className="mono"
          style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}
        >
          {H(fmtAmt(a.amount, 4))} {a.sym}
        </div>
      </div>
      <Sparkline
        data={a.spark}
        color={a.change >= 0 ? 'var(--green)' : 'var(--red)'}
        width={44}
        height={20}
      />
      <div style={{ textAlign: 'right', minWidth: 76 }}>
        <div
          className="tnum"
          style={{ fontSize: 13, fontWeight: 600 }}
        >
          {H(fmtUsd(a.amount * a.price))}
        </div>
        <div style={{ marginTop: 2 }}>
          <LivePill value={a.change} />
        </div>
      </div>
    </div>
  )
}

Object.assign(window, { AssetRow })
