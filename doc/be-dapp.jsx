// Mojito BE — dApp request window. Rendered as a separate popup when a site calls the provider.
// req: BE_REQUESTS[kind]; onDone(result: 'approved' | 'rejected')

function OriginCard({ req, s }) {
  const connected = s.sites.some((x) => x.origin === req.origin)
  return (
    <div className="origin">
      <div
        className="favicon"
        style={{
          background: `oklch(0.6 0.14 ${req.hue} / 0.25)`,
          color: `oklch(0.85 0.12 ${req.hue})`,
        }}
      >
        {req.name[0]}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{req.name}</div>
        <div
          className="mono"
          style={{
            fontSize: 10,
            color: 'var(--text-3)',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <Icon
            name="lock"
            size={9}
            color="var(--green)"
          />
          {req.origin}
        </div>
      </div>
      {connected ? (
        <Tag c="green">Connected</Tag>
      ) : (
        <Tag c="amber">New site</Tag>
      )}
    </div>
  )
}

function DappWindow({ s, req, onDone }) {
  const [locked, setLocked] = useState(s.locked)
  const [phase, setPhase] = useState('review') // review | password | sending | done
  const [pw, setPw] = useState('')
  const [bad, setBad] = useState(false)
  const [sel, setSel] = useState([s.account.id])
  const [showData, setShowData] = useState(s.showHex)
  const [tab, setTab] = useState('Summary')
  const [toast, toastEl] = useToast()
  const acct = s.account
  const needsPw =
    req.kind === 'tx' || req.kind === 'delegate' || req.kind === 'sign'
  const label = {
    connect: 'Connection request',
    sign: 'Signature request',
    tx: 'Transaction request',
    network: 'Switch network',
    token: 'Add token',
    delegate: 'Delegation request',
  }[req.kind]

  if (locked)
    return (
      <UnlockScreenBE
        reason={`${req.name} is waiting for your approval`}
        onUnlock={() => {
          s.unlock()
          setLocked(false)
        }}
        onForgot={() => onDone('rejected')}
      />
    )

  const approve = () => {
    if (needsPw && s.pwEveryTx && phase === 'review') {
      setPhase('password')
      return
    }
    finish()
  }
  const finish = () => {
    if (req.kind === 'tx' || req.kind === 'delegate') {
      setPhase('sending')
      setTimeout(() => {
        s.pushTx({
          type: 'dapp',
          sym: req.sym || 'ML',
          chain: req.chain || 'Mintlayer',
          amount: req.amount,
          usd: req.amount * (BE_PRICES[req.sym] || BE_PRICES.ML),
          to: req.origin,
          fee: `${req.fee} ${req.sym || 'ML'}`,
        })
        setPhase('done')
        setTimeout(() => onDone('approved'), 1100)
      }, 1300)
      return
    }
    if (req.kind === 'connect') s.connect(req, sel)
    if (req.kind === 'network') s.setNetwork(req.to)
    if (req.kind === 'token') s.addToken(req)
    setPhase('done')
    setTimeout(() => onDone('approved'), 900)
  }
  const confirmPw = () => {
    if (pw.length >= 4) finish()
    else {
      setBad(true)
      setTimeout(() => setBad(false), 500)
    }
  }

  if (phase === 'done')
    return (
      <div
        className="layer"
        data-screen-label="dApp · done"
      >
        <div
          className="scroll pad"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <Success
            title={
              {
                connect: 'Connected',
                sign: 'Signed',
                tx: 'Transaction sent',
                network: `Switched to ${req.to}`,
                token: `${req.ticker} added`,
                delegate: 'Delegated',
              }[req.kind]
            }
            sub={`Returning to ${req.origin}…`}
          />
        </div>
      </div>
    )
  if (phase === 'sending')
    return (
      <div
        className="layer"
        data-screen-label="dApp · broadcasting"
      >
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
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: '2.5px solid var(--amber)',
              borderTopColor: 'transparent',
              animation: 'spin-slow 0.8s linear infinite',
            }}
          ></div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>
            Broadcasting to {req.chain}…
          </div>
          <span className="hint">Do not close this window</span>
        </div>
      </div>
    )

  if (phase === 'password')
    return (
      <div
        className="layer step-in"
        data-screen-label="dApp · password"
      >
        <Hdr
          title="Confirm"
          onBack={() => setPhase('review')}
        />
        <div
          className="scroll pad"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <OriginCard
            req={req}
            s={s}
          />
          <div style={{ textAlign: 'center', marginTop: 22 }}>
            <div style={{ fontSize: 17, fontWeight: 700 }}>
              {req.kind === 'sign'
                ? 'Sign message'
                : `Sign ${req.amount} ${req.sym || 'ML'}`}
            </div>
            <div
              className="hint"
              style={{ marginTop: 4 }}
            >
              Enter your password to sign with {acct.name}.
            </div>
          </div>
          <div
            className={bad ? 'shake' : ''}
            style={{ marginTop: 18 }}
          >
            <PwField
              value={pw}
              onChange={setPw}
              autoFocus
              bad={bad}
              onEnter={confirmPw}
            />
          </div>
          {bad && (
            <span
              className="hint bad"
              style={{ marginTop: 8 }}
            >
              Incorrect password
            </span>
          )}
        </div>
        <div
          className="pad"
          style={{ paddingBottom: 18 }}
        >
          <button
            className="btn primary"
            style={{ width: '100%' }}
            onClick={confirmPw}
          >
            Sign
          </button>
        </div>
      </div>
    )

  // review phase per kind
  let body,
    cta = 'Approve',
    danger = false
  if (req.kind === 'connect') {
    body = (
      <React.Fragment>
        <div
          className="eyebrow"
          style={{ margin: '16px 0 6px' }}
        >
          Connect with
        </div>
        <div className="card">
          {s.accounts.map((a) => {
            const on = sel.includes(a.id)
            return (
              <div
                key={a.id}
                className="row"
                onClick={() =>
                  setSel((x) =>
                    on ? x.filter((i) => i !== a.id) : [...x, a.id],
                  )
                }
              >
                <Avatar acct={a} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{a.name}</div>
                  <div
                    className="mono"
                    style={{ fontSize: 10, color: 'var(--text-3)' }}
                  >
                    {shortAddr(a.ml, 6)}
                  </div>
                </div>
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 6,
                    border: `1.5px solid ${on ? 'var(--amber)' : 'var(--line)'}`,
                    background: on ? 'var(--amber)' : 'transparent',
                    color: '#1a1208',
                    fontSize: 12,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 150ms',
                  }}
                >
                  {on ? '✓' : ''}
                </div>
              </div>
            )
          })}
        </div>
        <div
          className="eyebrow"
          style={{ margin: '16px 0 6px' }}
        >
          This site will be able to
        </div>
        <div
          className="card"
          style={{ padding: '4px 14px' }}
        >
          {req.perms.map((p) => (
            <div
              key={p}
              style={{
                display: 'flex',
                gap: 10,
                padding: '9px 0',
                fontSize: 12,
                alignItems: 'center',
              }}
            >
              <span style={{ color: 'var(--green)' }}>✓</span>
              {p}
            </div>
          ))}
        </div>
        <div
          className="hint"
          style={{ marginTop: 10 }}
        >
          It cannot move funds without your approval for each transaction.
        </div>
      </React.Fragment>
    )
    cta = `Connect ${sel.length} account${sel.length !== 1 ? 's' : ''}`
  } else if (req.kind === 'sign') {
    body = (
      <React.Fragment>
        <div
          className="eyebrow"
          style={{ margin: '16px 0 6px' }}
        >
          Message
        </div>
        <pre
          className="mono"
          style={{
            margin: 0,
            padding: 12,
            borderRadius: 12,
            background: 'oklch(1 0 0 / 0.04)',
            border: '1px solid var(--line-soft)',
            fontSize: 11.5,
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            color: 'var(--text-1)',
            maxHeight: 190,
            overflow: 'auto',
          }}
        >
          {req.message}
        </pre>
        <div style={{ marginTop: 10 }}>
          <KV
            rows={[
              ['Signing as', `${acct.name} · ${shortAddr(acct.ml, 6)}`],
              ['Cost', 'Free · off-chain'],
            ]}
          />
        </div>
        <div
          className="hint"
          style={{ marginTop: 10 }}
        >
          Only sign messages you understand. Signing can authorise actions on
          the site, such as logging in.
        </div>
      </React.Fragment>
    )
    cta = 'Sign'
  } else if (req.kind === 'tx') {
    const total = req.amount + req.fee
    const bal = s.assets.find((x) => x.sym === req.sym).amount
    const low = total > bal
    body = (
      <React.Fragment>
        <div style={{ textAlign: 'center', padding: '18px 0 4px' }}>
          <div className="eyebrow">Sending</div>
          <div
            className="tnum"
            style={{
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              marginTop: 4,
            }}
          >
            {fmtAmt(req.amount, 8)}{' '}
            <span
              style={{ fontSize: 15, color: 'var(--text-2)', fontWeight: 500 }}
            >
              {req.sym}
            </span>
          </div>
          <div
            className="mono"
            style={{ fontSize: 12, color: 'var(--text-2)' }}
          >
            ≈ {fmtUsd(req.amount * BE_PRICES[req.sym])}
          </div>
        </div>
        <Seg
          value={tab}
          options={['Summary', 'Data']}
          onChange={setTab}
        />
        <div style={{ marginTop: 10 }}>
          {tab === 'Summary' ? (
            <KV
              rows={[
                [
                  'From',
                  `${acct.name} · ${shortAddr(req.chain === 'Bitcoin' ? acct.btc : acct.ml, 6)}`,
                ],
                ['To', req.to],
                ['Network', <ChainBadge chain={req.chain} />],
                ['Fee', `${req.fee} ${req.sym}`],
                [
                  'Total',
                  <span style={{ color: low ? 'var(--red)' : undefined }}>
                    {fmtAmt(total, 8)} {req.sym}
                  </span>,
                ],
              ]}
            />
          ) : (
            <pre
              className="mono"
              style={{
                margin: 0,
                padding: 12,
                borderRadius: 12,
                background: 'oklch(1 0 0 / 0.04)',
                border: '1px solid var(--line-soft)',
                fontSize: 11,
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                color: 'var(--text-1)',
              }}
            >
              {req.data}
              {'\n\n'}
              <span style={{ color: 'var(--text-3)' }}>
                raw: 0100000001a7c1f0…{'\n'}inputs: 1 · outputs: 2 · size: 141
                vB
              </span>
            </pre>
          )}
        </div>
        {low && (
          <div
            className="hint bad"
            style={{ marginTop: 10 }}
          >
            Insufficient {req.sym} balance ({fmtAmt(bal)} available).
          </div>
        )}
      </React.Fragment>
    )
    cta = `Approve · ${fmtAmt(req.amount, 8)} ${req.sym}`
  } else if (req.kind === 'network') {
    body = (
      <React.Fragment>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            justifyContent: 'center',
            padding: '26px 0 16px',
          }}
        >
          <span
            className="chip teal"
            style={{ fontSize: 13, padding: '8px 14px' }}
          >
            <span className="dot"></span>
            {req.from}
          </span>
          <Icon
            name="arrow_r"
            size={18}
            color="var(--text-2)"
          />
          <span
            className="chip amber"
            style={{ fontSize: 13, padding: '8px 14px' }}
          >
            <span className="dot"></span>
            {req.to}
          </span>
        </div>
        <div
          className="hint"
          style={{ textAlign: 'center' }}
        >
          {req.name} wants Mojito to switch to{' '}
          <b style={{ color: 'var(--text-0)' }}>{req.to}</b>. Balances and
          addresses shown in the wallet will change to that network until you
          switch back.
        </div>
      </React.Fragment>
    )
    cta = `Switch to ${req.to}`
  } else if (req.kind === 'token') {
    body = (
      <React.Fragment>
        <div style={{ textAlign: 'center', padding: '18px 0 12px' }}>
          <div style={{ display: 'inline-block' }}>
            <TokenIcon
              symbol={req.ticker}
              size={48}
            />
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, marginTop: 10 }}>
            {req.ticker}
          </div>
          <div className="hint">Mintlayer fungible token</div>
        </div>
        <KV
          rows={[
            ['Token ID', req.tokenId],
            ['Decimals', req.decimals],
            ['Total supply', req.supply],
            ['Authority', 'External · mtc1qbeat…9k'],
          ]}
        />
        <div
          className="hint"
          style={{ marginTop: 10 }}
        >
          Adding a token only shows it in your wallet. Verify the token ID
          against the project's official channels — anyone can create a token
          with this ticker.
        </div>
      </React.Fragment>
    )
    cta = 'Add token'
  } else if (req.kind === 'delegate') {
    body = (
      <React.Fragment>
        <div style={{ textAlign: 'center', padding: '18px 0 4px' }}>
          <div className="eyebrow">Delegate to pool</div>
          <div
            className="tnum"
            style={{ fontSize: 30, fontWeight: 700, marginTop: 4 }}
          >
            {req.amount}{' '}
            <span
              style={{ fontSize: 15, color: 'var(--text-2)', fontWeight: 500 }}
            >
              ML
            </span>
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <KV
            rows={[
              ['Pool', req.pool],
              ['From', `${acct.name} · ${shortAddr(acct.ml, 6)}`],
              ['Fee', `${req.fee} ML`],
              ['Withdrawal', 'Anytime · 7,200 blocks maturity'],
            ]}
          />
        </div>
        <div
          className="hint"
          style={{ marginTop: 10 }}
        >
          Delegated ML stays under your control; the pool only earns staking
          rewards on your behalf.
        </div>
      </React.Fragment>
    )
    cta = 'Delegate'
  }

  return (
    <div
      className="layer step-in"
      data-screen-label={`dApp · ${label}`}
    >
      <div
        className="hdr"
        style={{ justifyContent: 'center' }}
      >
        <span className="eyebrow">{label}</span>
      </div>
      <div className="scroll pad">
        <OriginCard
          req={req}
          s={s}
        />
        {body}
        <div style={{ height: 12 }}></div>
      </div>
      <div
        className="pad"
        style={{
          paddingBottom: 18,
          display: 'grid',
          gridTemplateColumns: '1fr 1.6fr',
          gap: 8,
        }}
      >
        <button
          className="btn"
          onClick={() => onDone('rejected')}
        >
          Reject
        </button>
        <button
          className={'btn ' + (danger ? 'danger' : 'primary')}
          disabled={req.kind === 'connect' && !sel.length}
          onClick={approve}
        >
          {cta}
        </button>
      </div>
      {toastEl}
    </div>
  )
}

Object.assign(window, { DappWindow, OriginCard })
