// TxRow — transaction list row. Composes: IconTile, Icon.
// From be-home.jsx TxRow; also used by Activity screen, Asset screen and Home.
const txIcon = {
  receive: ['arrow_dn', 'var(--green)'],
  send: ['arrow_up', 'var(--amber)'],
  mint: ['plus', 'var(--teal)'],
  nft: ['card', 'var(--violet)'],
  dapp: ['flash', 'var(--violet)'],
  burn: ['flash', 'var(--red)'],
}

function TxRow({ t, onClick }) {
  const [ic, col] = txIcon[t.type]
  const lbl = {
    receive: 'Received',
    send: 'Sent',
    mint: 'Minted',
    nft: 'NFT received',
    dapp: 'dApp payment',
    burn: 'Burned',
  }[t.type]
  const sc =
    t.status === 'Confirmed'
      ? 'var(--text-2)'
      : t.status === 'Failed'
        ? 'var(--red)'
        : 'var(--amber)'
  return (
    <div
      className="row"
      onClick={onClick}
    >
      <IconTile
        icon={ic}
        color={col}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>
          {lbl}
          {t.type === 'dapp' && (
            <span style={{ color: 'var(--text-2)' }}> · {t.to}</span>
          )}
        </div>
        <div
          className="mono"
          style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}
        >
          {t.when}
          {t.conf ? ` · ${t.conf} conf` : ''}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div
          className="mono"
          style={{
            fontSize: 12,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            color:
              t.type === 'receive' || t.type === 'mint'
                ? 'var(--green)'
                : 'var(--text-0)',
          }}
        >
          {t.type === 'nft'
            ? t.name
            : `${t.type === 'receive' || t.type === 'mint' ? '+' : '−'}${fmtAmt(t.amount, 6)} ${t.sym}`}
        </div>
        <div style={{ fontSize: 10, color: sc, marginTop: 2 }}>{t.status}</div>
      </div>
    </div>
  )
}

Object.assign(window, { TxRow, txIcon })
