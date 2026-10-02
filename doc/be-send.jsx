// Mojito BE — Send (tokens + NFTs) and Receive

const BTC_FEES = {
  economy: { l: 'Economy', eta: '~60 min', rate: 4 },
  standard: { l: 'Standard', eta: '~20 min', rate: 11 },
  fast: { l: 'Fast', eta: '~10 min', rate: 22 },
}
const validAddr = (addr, chain) =>
  chain === 'Bitcoin'
    ? /^(bc1|tb1)[a-z0-9]{25,}$/i.test(addr)
    : /^(mtc|tmt)1q[a-z0-9]{25,}$/i.test(addr)

function SendScreenBE({ s, nav, asset: initAsset, nft: nftId }) {
  const nft = nftId ? s.nfts.find((n) => n.id === nftId) : null
  const [assetId, setAssetId] = useState(initAsset || (nft ? 'ml' : 'btc'))
  const a = s.assets.find((x) => x.id === assetId)
  const chain = nft ? 'Mintlayer' : a.chain
  const [step, setStep] = useState(0) // 0 form, 1 review, 2 password, 3 done
  const [to, setTo] = useState('')
  const [amt, setAmt] = useState('')
  const [inUsd, setInUsd] = useState(false)
  const [fee, setFee] = useState('standard')
  const [pick, setPick] = useState(false)
  const [pw, setPw] = useState('')
  const [bad, setBad] = useState(false)
  const [toast, toastEl] = useToast()
  const num = parseFloat(amt) || 0
  const tokenAmt = inUsd ? (a.price ? num / a.price : 0) : num
  const feeAmt = chain === 'Bitcoin' ? (BTC_FEES[fee].rate * 141) / 1e8 : 0.2
  const feeSym = chain === 'Bitcoin' ? 'BTC' : 'ML'
  const mlBal = s.assets.find((x) => x.id === 'ml').amount
  const addrOk = validAddr(to, chain)
  const insufficient = nft
    ? mlBal < feeAmt
    : (a.id === 'ml' ? tokenAmt + feeAmt > a.amount : tokenAmt > a.amount) ||
      (chain === 'Mintlayer' && a.id !== 'ml' && mlBal < feeAmt)
  const canReview = addrOk && (nft || tokenAmt > 0) && !insufficient
  const setMax = () => {
    setInUsd(false)
    setAmt(
      String(
        a.id === 'ml' || a.id === 'btc'
          ? Math.max(0, a.amount - feeAmt)
          : a.amount,
      ),
    )
  }
  const confirm = () => {
    if (pw.length >= 4) {
      s.pushTx(
        nft
          ? {
              type: 'nft',
              sym: 'NFT',
              chain,
              name: nft.name,
              to,
              fee: '0.2 ML',
            }
          : {
              type: 'send',
              sym: a.sym,
              chain,
              amount: tokenAmt,
              usd: tokenAmt * a.price,
              to,
              fee: `${feeAmt} ${feeSym}`,
            },
      )
      if (nft) s.removeNft(nft.id)
      setStep(3)
    } else {
      setBad(true)
      setTimeout(() => setBad(false), 500)
    }
  }
  const title = nft ? 'Transfer NFT' : 'Send'

  if (step === 3)
    return (
      <div
        className="layer"
        data-screen-label="Sent"
      >
        <Hdr
          title=""
          onClose={nav.closeAll}
        />
        <div className="scroll pad">
          <Success
            title={nft ? 'NFT transferred' : 'Sent'}
            sub={`${nft ? nft.name : `${fmtAmt(tokenAmt, 8)} ${a.sym}`} → ${shortAddr(to, 6)}`}
          >
            <div style={{ marginTop: 22 }}>
              <KV
                rows={[
                  [
                    'Status',
                    <span style={{ color: 'var(--amber)' }}>
                      ● Broadcast · 0/{chain === 'Bitcoin' ? 6 : 1} conf
                    </span>,
                  ],
                  [
                    'Tx hash',
                    chain === 'Bitcoin' ? 'a7c1f0…3d9e' : '0x82bd…41f7',
                  ],
                  ['Network fee', `${feeAmt} ${feeSym}`],
                ]}
              />
            </div>
          </Success>
        </div>
        <div
          className="pad"
          style={{
            paddingBottom: 22,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <button
            className="btn primary"
            onClick={nav.closeAll}
          >
            Done
          </button>
          <button
            className="btn ghost sm"
            onClick={() => toast('Opened in explorer')}
          >
            View on explorer →
          </button>
        </div>
        {toastEl}
      </div>
    )

  if (step === 2)
    return (
      <div
        className="layer step-in"
        data-screen-label="Confirm with password"
      >
        <Hdr
          title="Confirm"
          onBack={() => setStep(1)}
          onClose={nav.closeAll}
        />
        <div
          className="scroll pad"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                margin: '0 auto',
                background: 'var(--amber-soft)',
                border: '1.5px solid var(--amber)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 24px oklch(0.82 0.16 70 / 0.3)',
              }}
            >
              <Icon
                name="lock"
                size={26}
                color="var(--amber)"
              />
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 16 }}>
              Sign {nft ? 'transfer' : `${fmtAmt(tokenAmt, 8)} ${a.sym}`}
            </div>
            <div
              className="hint"
              style={{ marginTop: 4 }}
            >
              Enter your password to sign and broadcast on {chain}.
            </div>
          </div>
          <div
            className={bad ? 'shake' : ''}
            style={{ marginTop: 22 }}
          >
            <PwField
              value={pw}
              onChange={setPw}
              autoFocus
              bad={bad}
              onEnter={confirm}
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
          style={{ paddingBottom: 22 }}
        >
          <button
            className="btn primary"
            style={{ width: '100%' }}
            onClick={confirm}
          >
            Sign & send
          </button>
        </div>
      </div>
    )

  if (step === 1)
    return (
      <div
        className="layer step-in"
        data-screen-label="Review send"
      >
        <Hdr
          title="Review"
          onBack={() => setStep(0)}
          onClose={nav.closeAll}
        />
        <div className="scroll pad">
          <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
            <div className="eyebrow">You send</div>
            {nft ? (
              <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>
                {nft.name}
              </div>
            ) : (
              <React.Fragment>
                <div
                  className="tnum"
                  style={{
                    fontSize: 32,
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    marginTop: 6,
                  }}
                >
                  {fmtAmt(tokenAmt, 8)}{' '}
                  <span
                    style={{
                      fontSize: 16,
                      color: 'var(--text-2)',
                      fontWeight: 500,
                    }}
                  >
                    {a.sym}
                  </span>
                </div>
                <div
                  className="mono"
                  style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}
                >
                  ≈ {fmtUsd(tokenAmt * a.price)}
                </div>
              </React.Fragment>
            )}
          </div>
          <KV
            rows={[
              ['To', to],
              [
                'From',
                `${s.account.name} · ${shortAddr(chain === 'Bitcoin' ? s.account.btc : s.account.ml, 6)}`,
              ],
              ['Network', <ChainBadge chain={chain} />],
              [
                'Fee',
                `${feeAmt} ${feeSym}${chain === 'Bitcoin' ? ` · ${BTC_FEES[fee].rate} sat/vB` : ''}`,
              ],
              ['Arrival', chain === 'Bitcoin' ? BTC_FEES[fee].eta : '~2 min'],
              ...(nft || a.sym !== feeSym
                ? []
                : [['Total', `${fmtAmt(tokenAmt + feeAmt, 8)} ${a.sym}`]]),
            ]}
          />
          {chain === 'Bitcoin' && (
            <div
              className="hint"
              style={{ marginTop: 10 }}
            >
              Bitcoin transactions are final once confirmed. Double-check the
              address.
            </div>
          )}
        </div>
        <div
          className="pad"
          style={{ paddingBottom: 22 }}
        >
          <HoldButton
            label={`Hold to send`}
            onDone={() => setStep(2)}
          />
        </div>
      </div>
    )

  return (
    <div
      className="layer step-in"
      data-screen-label={title}
    >
      <Hdr
        title={title}
        onClose={nav.closeAll}
      />
      <div
        className="scroll pad"
        style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
      >
        {nft ? (
          <div
            className="card"
            style={{
              display: 'flex',
              gap: 12,
              padding: 12,
              alignItems: 'center',
            }}
          >
            <div
              className="nft"
              style={{
                width: 48,
                height: 48,
                borderRadius: 10,
                cursor: 'default',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: `radial-gradient(circle at 30% 20%, oklch(0.6 0.14 ${nft.hue} / 0.6), transparent 70%)`,
                }}
              ></div>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{nft.name}</div>
              <div className="hint">{nft.collection} · Mintlayer</div>
            </div>
          </div>
        ) : (
          <div className="field">
            <label>Asset</label>
            <div
              className="inp"
              style={{ cursor: 'pointer' }}
              onClick={() => setPick(true)}
            >
              <TokenIcon
                symbol={a.sym}
                size={24}
              />
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>
                {a.sym}{' '}
                <span style={{ color: 'var(--text-2)', fontWeight: 400 }}>
                  · {a.name}
                </span>
              </span>
              <span
                className="mono"
                style={{ fontSize: 11, color: 'var(--text-2)' }}
              >
                {fmtAmt(a.amount, 4)}
              </span>
              <Icon
                name="chevron_r"
                size={14}
                color="var(--text-3)"
              />
            </div>
          </div>
        )}
        <div className="field">
          <label>Recipient · {chain}</label>
          <div
            className={'inp' + (to && !addrOk ? ' bad' : addrOk ? ' ok' : '')}
          >
            <input
              className="mono"
              style={{ fontFamily: "'JetBrains Mono'", fontSize: 12 }}
              placeholder={chain === 'Bitcoin' ? 'bc1q…' : 'mtc1q…'}
              value={to}
              onChange={(e) => setTo(e.target.value.trim())}
              spellCheck={false}
            />
            <button
              className="act"
              onClick={() =>
                setTo(
                  chain === 'Bitcoin' ? s.accounts[1].btc : s.accounts[1].ml,
                )
              }
            >
              Paste
            </button>
            <span
              style={{ display: 'flex', cursor: 'pointer' }}
              onClick={() => toast('Scanner opens in a new tab')}
            >
              <Icon
                name="scan"
                size={16}
                color="var(--text-2)"
              />
            </span>
          </div>
          {to && !addrOk && (
            <span className="hint bad">
              Not a valid {chain} address
              {chain === 'Mintlayer' ? ' (expects mtc1q… on mainnet)' : ''}
            </span>
          )}
          {addrOk && s.accounts.some((x) => x.btc === to || x.ml === to) && (
            <span className="hint">One of your own accounts</span>
          )}
        </div>
        {!nft && (
          <div className="field">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label>Amount</label>
              <span
                className="hint"
                style={{ cursor: 'pointer', color: 'var(--amber)' }}
                onClick={() => a.price && setInUsd((u) => !u)}
              >
                {inUsd
                  ? `≈ ${fmtAmt(tokenAmt, 6)} ${a.sym}`
                  : `≈ ${fmtUsd(tokenAmt * a.price)}`}{' '}
                ⇅
              </span>
            </div>
            <div
              className={'inp' + (insufficient ? ' bad' : '')}
              style={{ height: 56 }}
            >
              {inUsd && (
                <span style={{ color: 'var(--text-2)', fontSize: 18 }}>$</span>
              )}
              <input
                className="mono"
                style={{
                  fontSize: 22,
                  fontWeight: 600,
                  fontFamily: "'JetBrains Mono'",
                }}
                placeholder="0"
                value={amt}
                onChange={(e) => setAmt(e.target.value.replace(/[^\d.]/g, ''))}
                inputMode="decimal"
              />
              {!inUsd && (
                <span
                  className="mono"
                  style={{ fontSize: 13, color: 'var(--text-2)' }}
                >
                  {a.sym}
                </span>
              )}
              <button
                className="act"
                onClick={setMax}
              >
                Max
              </button>
            </div>
            <span className={'hint' + (insufficient ? ' bad' : '')}>
              {insufficient
                ? chain === 'Mintlayer' && a.id !== 'ml' && mlBal < feeAmt
                  ? 'Not enough ML to pay the network fee'
                  : 'Insufficient balance'
                : `Available ${fmtAmt(a.amount, 8)} ${a.sym}`}
            </span>
          </div>
        )}
        <div className="field">
          <label>Network fee</label>
          {chain === 'Bitcoin' ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3,1fr)',
                gap: 6,
              }}
            >
              {Object.entries(BTC_FEES).map(([k, f]) => (
                <div
                  key={k}
                  onClick={() => setFee(k)}
                  style={{
                    padding: '10px 8px',
                    borderRadius: 12,
                    cursor: 'pointer',
                    textAlign: 'center',
                    background:
                      fee === k ? 'var(--amber-soft)' : 'oklch(1 0 0 / 0.03)',
                    border: `1px solid ${fee === k ? 'oklch(0.82 0.16 70 / 0.5)' : 'var(--line-soft)'}`,
                    transition: 'all 150ms',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{f.l}</div>
                  <div
                    className="mono"
                    style={{
                      fontSize: 10,
                      color: 'var(--text-2)',
                      marginTop: 3,
                    }}
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
          ) : (
            <div
              className="inp"
              style={{ justifyContent: 'space-between' }}
            >
              <span style={{ fontSize: 13 }}>
                0.2 ML{' '}
                <span style={{ color: 'var(--text-2)' }}>
                  · ≈ {fmtUsd(0.2 * BE_PRICES.ML)}
                </span>
              </span>
              <Tag c="teal">~2 min</Tag>
            </div>
          )}
        </div>
      </div>
      <div
        className="pad"
        style={{ paddingBottom: 22, paddingTop: 10 }}
      >
        <button
          className="btn primary"
          style={{ width: '100%' }}
          disabled={!canReview}
          onClick={() => setStep(1)}
        >
          Review
        </button>
      </div>
      <BeSheet
        open={pick}
        onClose={() => setPick(false)}
        title="Select asset"
        label="Asset picker"
      >
        <div className="card">
          {s.assets
            .filter((x) => !x.hidden)
            .map((x) => (
              <div
                key={x.id}
                className="row"
                onClick={() => {
                  setAssetId(x.id)
                  setTo('')
                  setAmt('')
                  setPick(false)
                }}
              >
                <TokenIcon
                  symbol={x.sym}
                  size={30}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{x.sym}</div>
                  <div className="hint">{x.chain}</div>
                </div>
                <span
                  className="mono"
                  style={{ fontSize: 12 }}
                >
                  {fmtAmt(x.amount, 4)}
                </span>
              </div>
            ))}
        </div>
      </BeSheet>
      {toastEl}
    </div>
  )
}

function ReceiveScreenBE({ s, nav, chain: init }) {
  const [chain, setChain] = useState(init || 'Bitcoin')
  const [fresh, setFresh] = useState(0)
  const [toast, toastEl] = useToast()
  const base = chain === 'Bitcoin' ? s.account.btc : s.account.ml
  const addr = fresh
    ? base.slice(0, -4) + ['k7x2', 'p9m4', 'z3q8'][fresh % 3]
    : base
  const col = chain === 'Bitcoin' ? 'var(--amber)' : 'var(--teal)'
  return (
    <div
      className="layer step-in"
      data-screen-label="Receive"
    >
      <Hdr
        title="Receive"
        onClose={nav.closeAll}
      />
      <div
        className="scroll pad"
        style={{ textAlign: 'center' }}
      >
        <Seg
          value={chain}
          options={['Bitcoin', 'Mintlayer']}
          onChange={(c) => {
            setChain(c)
            setFresh(0)
          }}
        />
        <div
          style={{
            marginTop: 22,
            padding: 16,
            borderRadius: 22,
            background: 'oklch(1 0 0 / 0.03)',
            border: `1px solid ${col}`,
            boxShadow: `0 0 40px -10px ${col}`,
            display: 'inline-block',
            transition: 'all 300ms',
          }}
        >
          <QrPlaceholder
            size={172}
            label={`QR · ${chain} address`}
          />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 6,
            marginTop: 14,
          }}
        >
          <ChainBadge chain={chain} />
          <Tag c="grey">{s.account.name}</Tag>
        </div>
        <div
          className="mono"
          style={{
            marginTop: 12,
            padding: '12px 14px',
            borderRadius: 12,
            background: 'oklch(1 0 0 / 0.04)',
            border: '1px solid var(--line-soft)',
            fontSize: 12,
            wordBreak: 'break-all',
            lineHeight: 1.5,
            color: 'var(--text-1)',
          }}
        >
          {addr}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button
            className="btn primary sm"
            style={{ flex: 1 }}
            onClick={() => toast('Address copied')}
          >
            Copy address
          </button>
          <button
            className="btn sm"
            style={{ flex: 1 }}
            onClick={() => toast('Share sheet opened')}
          >
            Share
          </button>
        </div>
        {chain === 'Bitcoin' && (
          <button
            className="btn ghost sm"
            style={{ marginTop: 6 }}
            onClick={() => {
              setFresh((f) => f + 1)
              toast('New unused address')
            }}
          >
            Generate new address
          </button>
        )}
        <div
          className="hint"
          style={{ margin: '12px 0 20px' }}
        >
          {chain === 'Bitcoin'
            ? 'Native SegWit (bech32). A fresh address per payment protects your privacy.'
            : 'Use this address for ML and all Mintlayer tokens and NFTs.'}
        </div>
      </div>
      {toastEl}
    </div>
  )
}

Object.assign(window, { SendScreenBE, ReceiveScreenBE, validAddr })
