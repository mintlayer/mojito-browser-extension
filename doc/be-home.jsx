// Mojito BE — Home, asset detail, NFTs, manage assets. Props: s (store), nav (open/close/toast)

function AppTop({ s, nav }) {
  const a = s.account
  return (
    <div
      className="hdr"
      style={{ padding: '10px 14px 6px' }}
    >
      <div
        onClick={() => nav.sheet('accounts')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          flex: 1,
          cursor: 'pointer',
          padding: '4px 8px 4px 4px',
          borderRadius: 12,
        }}
      >
        <Avatar
          acct={a}
          size={30}
        />
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {a.name}
            <Icon
              name="chevron_r"
              size={12}
              color="var(--text-3)"
            />
          </div>
          <div
            className="mono"
            style={{ fontSize: 10, color: 'var(--text-3)' }}
          >
            {shortAddr(a.ml, 7)}
          </div>
        </div>
      </div>
      <span
        className={'chip ' + (s.network === 'Mainnet' ? 'teal' : 'amber')}
        style={{ cursor: 'pointer' }}
        onClick={() => nav.open({ t: 'settings', page: 'network' })}
      >
        <span className="dot"></span>
        {s.network}
      </span>
      <div
        className="ib"
        onClick={() => nav.tab('settings')}
      >
        <Icon
          name="settings"
          size={16}
        />
      </div>
    </div>
  )
}

function AccountsSheet({ s, nav }) {
  return (
    <BeSheet
      open
      onClose={nav.closeSheet}
      title="Accounts"
      label="Account switcher"
    >
      <div className="card">
        {s.accounts.map((a) => (
          <div
            key={a.id}
            className="row"
            onClick={() => {
              s.setAccount(a.id)
              nav.closeSheet()
            }}
          >
            <Avatar acct={a} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{a.name}</div>
              <div
                className="mono"
                style={{ fontSize: 10, color: 'var(--text-3)' }}
              >
                {shortAddr(a.btc, 7)}
              </div>
            </div>
            {a.id === s.account.id ? (
              <Tag c="amber">Active</Tag>
            ) : (
              <div
                className="mono"
                style={{ fontSize: 11, color: 'var(--text-2)' }}
              >
                {fmtUsd(a.id === 'a2' ? 2103.18 : 112.55)}
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button
          className="btn sm"
          style={{ flex: 1 }}
          onClick={() => {
            s.addAccount()
            nav.closeSheet()
            nav.toast('Account 4 created')
          }}
        >
          <Icon
            name="plus"
            size={14}
          />
          New account
        </button>
        <button
          className="btn sm"
          style={{ flex: 1 }}
          onClick={() => {
            nav.closeSheet()
            nav.open({ t: 'settings', page: 'accounts' })
          }}
        >
          Manage
        </button>
      </div>
    </BeSheet>
  )
}

function HomeScreenBE({ s, nav }) {
  const [tab, setTab] = useState('Tokens')
  const visible = s.assets.filter((a) => !a.hidden)
  const total = visible.reduce((t, a) => t + a.amount * a.price, 0)
  const dayChange = visible.reduce(
    (t, a) => t + (a.amount * a.price * a.change) / 100,
    0,
  )
  const H = (v) => (s.hideBal ? '••••' : v)
  return (
    <div
      className="layer"
      data-screen-label="Home"
    >
      <AppTop
        s={s}
        nav={nav}
      />
      <div className="scroll">
        <div
          className="pad"
          style={{ paddingTop: 8 }}
        >
          <div
            style={{
              position: 'relative',
              padding: '18px 18px 16px',
              borderRadius: 20,
              background:
                'linear-gradient(155deg, oklch(0.24 0.02 60), oklch(0.18 0.014 60))',
              border: '1px solid var(--line-soft)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 170,
                height: 170,
                borderRadius: '50%',
                background:
                  'radial-gradient(circle, oklch(0.82 0.16 70 / 0.35), transparent 70%)',
                filter: 'blur(20px)',
                animation: 'float-y 4s ease-in-out infinite',
              }}
            ></div>
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="eyebrow">Total balance</span>
                <span
                  onClick={() => s.setHideBal(!s.hideBal)}
                  style={{ cursor: 'pointer', display: 'flex' }}
                >
                  <Icon
                    name={s.hideBal ? 'eye_off' : 'eye'}
                    size={13}
                    color="var(--text-2)"
                  />
                </span>
              </div>
              <div
                className="tnum"
                style={{
                  fontSize: 34,
                  fontWeight: 700,
                  letterSpacing: '-0.025em',
                  marginTop: 4,
                }}
              >
                {s.hideBal ? (
                  '••••••'
                ) : (
                  <React.Fragment>
                    <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>
                      $
                    </span>
                    <Counter value={total} />
                  </React.Fragment>
                )}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 6,
                }}
              >
                <LivePill value={total ? (dayChange / total) * 100 : 0} />
                <span
                  className="mono"
                  style={{ fontSize: 11, color: 'var(--text-2)' }}
                >
                  {H(
                    (dayChange >= 0 ? '+' : '−') + fmtUsd(Math.abs(dayChange)),
                  )}{' '}
                  · 24h
                </span>
              </div>
            </div>
          </div>
          <div
            className="qa"
            style={{ marginTop: 10 }}
          >
            <button onClick={() => nav.open({ t: 'send' })}>
              <Icon
                name="arrow_up"
                size={18}
              />
              <span>Send</span>
            </button>
            <button onClick={() => nav.open({ t: 'receive' })}>
              <Icon
                name="arrow_dn"
                size={18}
              />
              <span>Receive</span>
            </button>
            <button onClick={() => nav.open({ t: 'manage' })}>
              <Icon
                name="plus"
                size={18}
                color="var(--teal)"
              />
              <span>Manage</span>
            </button>
          </div>
        </div>
        <div
          className="pad"
          style={{ marginTop: 20 }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600 }}>Assets</span>
            <Seg
              value={tab}
              options={['Tokens', 'NFTs']}
              onChange={setTab}
            />
          </div>
          {tab === 'Tokens' ? (
            <div
              className="card"
              style={{ padding: '2px 0' }}
            >
              {visible.map((a, i) => (
                <div
                  key={a.id}
                  className="row"
                  style={{
                    padding: '11px 14px',
                    animation: `slide-up 400ms ${i * 50}ms ease both`,
                  }}
                  onClick={() => nav.open({ t: 'asset', id: a.id })}
                >
                  <TokenIcon
                    symbol={a.sym}
                    size={36}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 600 }}>
                        {a.sym}
                      </span>
                      {a.chain === 'Mintlayer' && a.id !== 'ml' && (
                        <Tag c="teal">Token</Tag>
                      )}
                      {a.authority && <Tag c="violet">Issuer</Tag>}
                    </div>
                    <div
                      className="mono"
                      style={{
                        fontSize: 11,
                        color: 'var(--text-2)',
                        marginTop: 2,
                      }}
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
              ))}
            </div>
          ) : (
            <NftGrid
              s={s}
              nav={nav}
            />
          )}
        </div>
        <div
          className="pad"
          style={{ marginTop: 20, paddingBottom: 20 }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600 }}>
              Recent activity
            </span>
            <span
              className="hint"
              style={{ cursor: 'pointer', color: 'var(--amber)' }}
              onClick={() => nav.tab('activity')}
            >
              See all →
            </span>
          </div>
          <div className="card">
            {s.activity.slice(0, 3).map((t) => (
              <TxRow
                key={t.id}
                t={t}
                onClick={() => nav.sheet({ t: 'tx', id: t.id })}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
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
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: `oklch(from ${col} l c h / 0.14)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon
          name={ic}
          size={15}
          color={col}
        />
      </div>
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

function NftGrid({ s, nav }) {
  if (!s.nfts.length)
    return (
      <Empty
        icon="card"
        title="No NFTs yet"
        sub="Mintlayer NFTs you receive appear here."
      />
    )
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {s.nfts.map((n, i) => (
        <div
          key={n.id}
          className="nft"
          style={{ animation: `slide-up 400ms ${i * 60}ms ease both` }}
          onClick={() => nav.open({ t: 'nft', id: n.id })}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(80% 80% at 30% 20%, oklch(0.6 0.14 ${n.hue} / 0.5), transparent 70%)`,
            }}
          ></div>
          <div
            className="ph"
            style={{
              position: 'absolute',
              inset: 10,
              border: 'none',
              background: 'transparent',
            }}
          >
            nft media
          </div>
          <div className="cap">
            {n.name}
            <div
              className="hint"
              style={{ fontSize: 10 }}
            >
              {n.collection}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function AssetScreenBE({ s, nav, id }) {
  const a = s.assets.find((x) => x.id === id)
  const [range, setRange] = useState('1D')
  const [act, setAct] = useState(null) // mint | burn | lock | freeze
  const [qty, setQty] = useState('')
  const txs = s.activity.filter((t) => t.sym === a.sym)
  const isToken = a.chain === 'Mintlayer' && a.id !== 'ml'
  const spark = useMemo(
    () =>
      Array.from(
        { length: 28 },
        (_, i) => 100 + Math.sin(i / 3 + a.change) * 8 + (i * a.change) / 10,
      ),
    [a, range],
  )
  const doAct = () => {
    s.tokenAction(a.id, act, parseFloat(qty || 0))
    nav.toast(
      {
        mint: `Minted ${qty} ${a.sym}`,
        burn: `Burned ${qty} ${a.sym}`,
        lock: 'Supply locked permanently',
        freeze: a.frozen ? `${a.sym} unfrozen` : `${a.sym} frozen`,
      }[act],
    )
    setAct(null)
    setQty('')
  }
  return (
    <div
      className="layer step-in"
      data-screen-label={`Asset · ${a.sym}`}
    >
      <Hdr
        title={a.name}
        onBack={nav.close}
        right={
          <div
            className="ib"
            onClick={() => nav.sheet({ t: 'assetmenu', id })}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <circle
                cx="5"
                cy="12"
                r="1.8"
              ></circle>
              <circle
                cx="12"
                cy="12"
                r="1.8"
              ></circle>
              <circle
                cx="19"
                cy="12"
                r="1.8"
              ></circle>
            </svg>
          </div>
        }
      />
      <div className="scroll">
        <div
          className="pad"
          style={{ textAlign: 'center', paddingTop: 10 }}
        >
          <div style={{ display: 'inline-block' }}>
            <TokenIcon
              symbol={a.sym}
              size={48}
            />
          </div>
          <div
            className="tnum"
            style={{
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              marginTop: 10,
            }}
          >
            {fmtAmt(a.amount, 6)}{' '}
            <span
              style={{ fontSize: 16, color: 'var(--text-2)', fontWeight: 500 }}
            >
              {a.sym}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 8,
              alignItems: 'center',
              marginTop: 4,
            }}
          >
            <span
              className="mono"
              style={{ fontSize: 12, color: 'var(--text-2)' }}
            >
              {fmtUsd(a.amount * a.price)}
            </span>
            <LivePill value={a.change} />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 6,
              marginTop: 8,
            }}
          >
            <ChainBadge chain={a.chain} />
            {a.authority && <Tag c="violet">You are the issuer</Tag>}
          </div>
        </div>
        <div
          className="pad"
          style={{ marginTop: 14 }}
        >
          <div
            className="card"
            style={{ padding: '12px 12px 8px' }}
          >
            <svg
              width="100%"
              height="70"
              viewBox="0 0 320 70"
              preserveAspectRatio="none"
            >
              <polyline
                style={{
                  strokeDasharray: 1200,
                  strokeDashoffset: 1200,
                  animation: 'draw 1.4s 0.2s ease-out forwards',
                }}
                points={spark
                  .map(
                    (v, i) =>
                      `${(i / 27) * 320},${70 - ((v - Math.min(...spark)) / (Math.max(...spark) - Math.min(...spark) || 1)) * 56 - 6}`,
                  )
                  .join(' ')}
                fill="none"
                stroke={a.change >= 0 ? 'var(--green)' : 'var(--red)'}
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
            <div
              className="mono"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 10,
                color: 'var(--text-3)',
                marginTop: 6,
                padding: '0 4px',
              }}
            >
              {['1H', '1D', '1W', '1M', '1Y'].map((r) => (
                <span
                  key={r}
                  onClick={() => setRange(r)}
                  style={{
                    cursor: 'pointer',
                    color: r === range ? 'var(--amber)' : undefined,
                  }}
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button
              className="btn primary sm"
              style={{ flex: 1 }}
              onClick={() => nav.open({ t: 'send', asset: a.id })}
            >
              <Icon
                name="arrow_up"
                size={14}
                color="currentColor"
              />
              Send
            </button>
            <button
              className="btn sm"
              style={{ flex: 1 }}
              onClick={() => nav.open({ t: 'receive', chain: a.chain })}
            >
              <Icon
                name="arrow_dn"
                size={14}
              />
              Receive
            </button>
          </div>
          {a.authority && (
            <div
              className="card"
              style={{ marginTop: 12, padding: 12 }}
            >
              <div
                className="eyebrow"
                style={{ marginBottom: 8 }}
              >
                Issuer controls
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 6,
                }}
              >
                <button
                  className="btn sm"
                  disabled={a.lockedSupply}
                  onClick={() => setAct('mint')}
                >
                  Mint
                </button>
                <button
                  className="btn sm"
                  onClick={() => setAct('burn')}
                >
                  Burn
                </button>
                <button
                  className="btn sm"
                  disabled={a.lockedSupply}
                  onClick={() => setAct('lock')}
                >
                  {a.lockedSupply ? 'Supply locked' : 'Lock supply'}
                </button>
                <button
                  className="btn sm"
                  onClick={() => setAct('freeze')}
                >
                  {a.frozen ? 'Unfreeze' : 'Freeze'}
                </button>
              </div>
              {a.frozen && (
                <div
                  className="hint bad"
                  style={{ marginTop: 8 }}
                >
                  Token is frozen — transfers are blocked for all holders.
                </div>
              )}
            </div>
          )}
          {isToken && (
            <div style={{ marginTop: 12 }}>
              <KV
                rows={[
                  ['Ticker', a.ticker],
                  ['Token ID', a.tokenId],
                  ['Decimals', a.decimals],
                  ['Total supply', a.supply],
                  ['Authority', a.authority ? 'This wallet' : 'External'],
                ]}
              />
            </div>
          )}
          <div style={{ marginTop: 18, marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>
              Activity
            </div>
            {txs.length ? (
              <div className="card">
                {txs.map((t) => (
                  <TxRow
                    key={t.id}
                    t={t}
                    onClick={() => nav.sheet({ t: 'tx', id: t.id })}
                  />
                ))}
              </div>
            ) : (
              <Empty title={`No ${a.sym} transactions`} />
            )}
          </div>
        </div>
      </div>
      <BeSheet
        open={!!act}
        onClose={() => setAct(null)}
        title={
          {
            mint: `Mint ${a.sym}`,
            burn: `Burn ${a.sym}`,
            lock: 'Lock total supply',
            freeze: a.frozen ? `Unfreeze ${a.sym}` : `Freeze ${a.sym}`,
          }[act]
        }
        label="Issuer action"
      >
        {(act === 'mint' || act === 'burn') && (
          <div className="field">
            <label>Amount</label>
            <div className="inp">
              <input
                className="mono"
                placeholder="0"
                value={qty}
                onChange={(e) => setQty(e.target.value.replace(/[^\d.]/g, ''))}
                autoFocus
              />
              <span
                className="mono"
                style={{ fontSize: 12, color: 'var(--text-2)' }}
              >
                {a.sym}
              </span>
            </div>
            <span className="hint">
              {act === 'mint'
                ? `Current supply ${a.supply}. Minting fee 100 ML.`
                : `You hold ${fmtAmt(a.amount)} ${a.sym}. Burned tokens are destroyed permanently.`}
            </span>
          </div>
        )}
        {act === 'lock' && (
          <div
            className="hint"
            style={{ color: 'var(--text-1)' }}
          >
            Locking supply is irreversible. No further {a.sym} can ever be
            minted. Fee 100 ML.
          </div>
        )}
        {act === 'freeze' && (
          <div
            className="hint"
            style={{ color: 'var(--text-1)' }}
          >
            {a.frozen
              ? 'Holders will be able to transfer again.'
              : 'All transfers of this token will be blocked until you unfreeze it.'}{' '}
            Fee 100 ML.
          </div>
        )}
        <div style={{ marginTop: 16 }}>
          <HoldButton
            className={act === 'burn' || act === 'lock' ? 'danger' : 'primary'}
            label={
              {
                mint: 'Hold to mint',
                burn: 'Hold to burn',
                lock: 'Hold to lock supply',
                freeze: 'Hold to confirm',
              }[act]
            }
            onDone={doAct}
          />
        </div>
      </BeSheet>
    </div>
  )
}

function AssetMenuSheet({ s, nav, id }) {
  const a = s.assets.find((x) => x.id === id)
  return (
    <BeSheet
      open
      onClose={nav.closeSheet}
      label="Asset menu"
    >
      <div className="card">
        <div
          className="row"
          onClick={() => {
            nav.toast('Opened in explorer')
            nav.closeSheet()
          }}
        >
          <Icon
            name="arrow_r"
            size={16}
            color="var(--text-1)"
          />
          <span style={{ fontSize: 13 }}>View on explorer</span>
        </div>
        <div
          className="row"
          onClick={() => {
            nav.toast('Token ID copied')
            nav.closeSheet()
          }}
        >
          <Icon
            name="qr"
            size={16}
            color="var(--text-1)"
          />
          <span style={{ fontSize: 13 }}>
            Copy {a.tokenId ? 'token ID' : 'address'}
          </span>
        </div>
        {a.tokenId && (
          <div
            className="row"
            onClick={() => {
              s.toggleHidden(a.id)
              nav.closeSheet()
              nav.close()
              nav.toast(`${a.sym} hidden`)
            }}
          >
            <Icon
              name="eye_off"
              size={16}
              color="var(--red)"
            />
            <span style={{ fontSize: 13, color: 'var(--red)' }}>
              Hide token
            </span>
          </div>
        )}
      </div>
    </BeSheet>
  )
}

function NftScreenBE({ s, nav, id }) {
  const n = s.nfts.find((x) => x.id === id)
  const [full, setFull] = useState(false)
  return (
    <div
      className="layer step-in"
      data-screen-label={`NFT · ${n.name}`}
    >
      <Hdr
        title={n.collection}
        onBack={nav.close}
      />
      <div className="scroll pad">
        <div
          className="nft"
          style={{ aspectRatio: '1', borderRadius: 18 }}
          onClick={() => setFull((f) => !f)}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(80% 80% at 30% 20%, oklch(0.6 0.14 ${n.hue} / 0.55), transparent 70%)`,
            }}
          ></div>
          <div
            className="ph"
            style={{
              position: 'absolute',
              inset: 14,
              border: 'none',
              background: 'transparent',
            }}
          >
            nft media · {n.name}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 14,
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700 }}>{n.name}</div>
          {n.mine && <Tag c="violet">Created by you</Tag>}
        </div>
        <div
          className="hint"
          style={{ marginTop: 6, color: 'var(--text-1)' }}
        >
          {n.desc}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button
            className="btn primary sm"
            style={{ flex: 1 }}
            onClick={() => nav.open({ t: 'send', nft: n.id })}
          >
            <Icon
              name="arrow_up"
              size={14}
              color="currentColor"
            />
            Transfer
          </button>
          <button
            className="btn sm"
            style={{ flex: 1 }}
            onClick={() => nav.toast('Opened in explorer')}
          >
            Explorer
          </button>
        </div>
        <div style={{ marginTop: 14, marginBottom: 20 }}>
          <KV
            rows={[
              ['Token ID', n.tokenId],
              ['Creator', n.creator],
              ['Chain', 'Mintlayer'],
              ['Standard', 'ML NFT v1'],
              ['Media', 'ipfs://bafy…q2k1'],
            ]}
          />
        </div>
      </div>
    </div>
  )
}

function ManageScreenBE({ s, nav }) {
  const [q, setQ] = useState('')
  const [addId, setAddId] = useState('')
  const tokens = s.assets.filter(
    (a) => a.tokenId && a.name.toLowerCase().includes(q.toLowerCase()),
  )
  const okId = /^tmltk1q[a-z0-9]{6,}$/i.test(addId)
  return (
    <div
      className="layer step-in"
      data-screen-label="Manage assets"
    >
      <Hdr
        title="Manage assets"
        onBack={nav.close}
      />
      <div className="scroll pad">
        <div className="inp">
          <Icon
            name="scan"
            size={15}
            color="var(--text-3)"
          />
          <input
            placeholder="Search tokens"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div
          className="eyebrow"
          style={{ margin: '18px 0 8px' }}
        >
          Mintlayer tokens
        </div>
        <div className="card">
          {tokens.map((a) => (
            <div
              key={a.id}
              className="row"
              style={{ cursor: 'default' }}
            >
              <TokenIcon
                symbol={a.sym}
                size={32}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{a.name}</div>
                <div
                  className="mono"
                  style={{ fontSize: 10, color: 'var(--text-3)' }}
                >
                  {a.tokenId}
                </div>
              </div>
              <Switch
                on={!a.hidden}
                onChange={() => s.toggleHidden(a.id)}
              />
            </div>
          ))}
        </div>
        <div
          className="eyebrow"
          style={{ margin: '18px 0 8px' }}
        >
          Add custom token
        </div>
        <div
          className="card"
          style={{ padding: 12 }}
        >
          <div className="field">
            <label>Token ID</label>
            <div
              className={'inp' + (addId && !okId ? ' bad' : okId ? ' ok' : '')}
            >
              <input
                className="mono"
                placeholder="tmltk1q…"
                value={addId}
                onChange={(e) => setAddId(e.target.value.trim())}
              />
            </div>
          </div>
          {okId && (
            <div
              className="hint ok"
              style={{ marginTop: 8 }}
            >
              Found: BEATS · 4 decimals · supply 10,000,000
            </div>
          )}
          <button
            className="btn sm"
            style={{ width: '100%', marginTop: 10 }}
            disabled={!okId}
            onClick={() => {
              s.addToken({
                ticker: 'BEATS',
                tokenId: addId,
                decimals: 4,
                supply: '10,000,000',
              })
              setAddId('')
              nav.toast('BEATS added')
            }}
          >
            Add token
          </button>
        </div>
        <div
          className="hint"
          style={{ margin: '14px 0 20px' }}
        >
          Bitcoin and ML are always shown. Hidden tokens stay in your wallet and
          can be re-enabled here.
        </div>
      </div>
    </div>
  )
}

Object.assign(window, {
  AppTop,
  AccountsSheet,
  HomeScreenBE,
  TxRow,
  NftGrid,
  AssetScreenBE,
  AssetMenuSheet,
  NftScreenBE,
  ManageScreenBE,
})
