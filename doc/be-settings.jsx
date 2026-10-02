// Mojito BE — Activity tab, tx detail, Settings (with sub pages)

function ActivityScreenBE({ s, nav }) {
  const [f, setF] = useState('All')
  const list = s.activity.filter(
    (t) =>
      f === 'All' ||
      (f === 'BTC' ? t.chain === 'Bitcoin' : t.chain === 'Mintlayer'),
  )
  const pending = list.filter(
    (t) => t.status !== 'Confirmed' && t.status !== 'Failed',
  )
  return (
    <div
      className="layer"
      data-screen-label="Activity"
    >
      <AppTop
        s={s}
        nav={nav}
      />
      <div className="scroll pad">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 6,
            marginBottom: 12,
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 700 }}>Activity</span>
          <Seg
            value={f}
            options={['All', 'BTC', 'ML']}
            onChange={setF}
          />
        </div>
        {pending.length > 0 && (
          <React.Fragment>
            <div
              className="eyebrow"
              style={{ marginBottom: 6 }}
            >
              Pending
            </div>
            <div
              className="card"
              style={{
                marginBottom: 14,
                borderColor: 'oklch(0.82 0.16 70 / 0.3)',
              }}
            >
              {pending.map((t) => (
                <TxRow
                  key={t.id}
                  t={t}
                  onClick={() => nav.sheet({ t: 'tx', id: t.id })}
                />
              ))}
            </div>
          </React.Fragment>
        )}
        <div
          className="eyebrow"
          style={{ marginBottom: 6 }}
        >
          History
        </div>
        {list.length ? (
          <div
            className="card"
            style={{ marginBottom: 20 }}
          >
            {list
              .filter((t) => !pending.includes(t))
              .map((t) => (
                <TxRow
                  key={t.id}
                  t={t}
                  onClick={() => nav.sheet({ t: 'tx', id: t.id })}
                />
              ))}
          </div>
        ) : (
          <Empty
            title="No transactions"
            sub="Activity on the selected network will show here."
          />
        )}
      </div>
    </div>
  )
}

function TxSheet({ s, nav, id }) {
  const t = s.activity.find((x) => x.id === id)
  const [ic, col] = txIcon[t.type]
  const sc =
    t.status === 'Confirmed'
      ? 'var(--green)'
      : t.status === 'Failed'
        ? 'var(--red)'
        : 'var(--amber)'
  return (
    <BeSheet
      open
      onClose={nav.closeSheet}
      label="Transaction detail"
    >
      <div style={{ textAlign: 'center', paddingBottom: 14 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            margin: '0 auto',
            background: `oklch(from ${col} l c h / 0.14)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon
            name={ic}
            size={20}
            color={col}
          />
        </div>
        <div
          className="mono"
          style={{ fontSize: 22, fontWeight: 700, marginTop: 10 }}
        >
          {t.type === 'nft'
            ? t.name
            : `${t.type === 'receive' || t.type === 'mint' ? '+' : '−'}${fmtAmt(t.amount, 8)} ${t.sym}`}
        </div>
        {t.usd != null && (
          <div className="hint">{fmtUsd(t.usd)} at the time</div>
        )}
        <div style={{ marginTop: 8 }}>
          <span
            className="tag"
            style={{ color: sc, background: `oklch(from ${sc} l c h / 0.12)` }}
          >
            {t.status}
            {t.conf ? ` · ${t.conf}` : ''}
          </span>
        </div>
      </div>
      <KV
        rows={[
          ['Date', t.when],
          ['Network', <ChainBadge chain={t.chain} />],
          ...(t.from ? [['From', t.from]] : []),
          ...(t.to ? [['To', t.to]] : []),
          ...(t.fee ? [['Fee', t.fee]] : []),
          ['Hash', t.hash],
        ]}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button
          className="btn sm"
          style={{ flex: 1 }}
          onClick={() => {
            nav.toast('Hash copied')
          }}
        >
          Copy hash
        </button>
        <button
          className="btn sm"
          style={{ flex: 1 }}
          onClick={() => nav.toast('Opened in explorer')}
        >
          Explorer →
        </button>
      </div>
      {t.status === 'Confirming' && t.chain === 'Bitcoin' && (
        <button
          className="btn ghost sm"
          style={{ width: '100%', marginTop: 6 }}
          onClick={() => nav.toast('Fee bump (RBF) queued')}
        >
          Speed up · bump fee
        </button>
      )}
    </BeSheet>
  )
}

// Settings root + pages: accounts | security | network | sites | prefs | about
const SET_PAGES = {
  accounts: 'Accounts',
  security: 'Security',
  network: 'Network',
  sites: 'Connected sites',
  prefs: 'Preferences',
  about: 'About',
}

function SettingsScreenBE({ s, nav, page: initPage }) {
  const [page, setPage] = useState(initPage || null)
  if (page)
    return (
      <SettingsPage
        s={s}
        nav={nav}
        page={page}
        onBack={() => (initPage ? nav.close() : setPage(null))}
      />
    )
  const items = [
    [
      'accounts',
      'shield',
      'Accounts',
      `${s.accounts.length} accounts · ${s.account.name} active`,
    ],
    ['security', 'lock', 'Security', `Auto-lock ${s.autoLock} · password`],
    ['network', 'bridge', 'Network', `${s.network} · public nodes`],
    ['sites', 'flash', 'Connected sites', `${s.sites.length} sites`],
    ['prefs', 'settings', 'Preferences', `${s.currency} · English`],
    ['about', 'history', 'About', 'Mojito 2.0.0'],
  ]
  return (
    <div
      className="layer"
      data-screen-label="Settings"
    >
      <AppTop
        s={s}
        nav={nav}
      />
      <div className="scroll pad">
        <div style={{ fontSize: 16, fontWeight: 700, margin: '6px 0 12px' }}>
          Settings
        </div>
        <div className="card">
          {items.map(([id, ic, t, sub]) => (
            <div
              key={id}
              className="row"
              onClick={() => setPage(id)}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: 'oklch(1 0 0 / 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon
                  name={ic}
                  size={15}
                  color="var(--text-1)"
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{t}</div>
                <div
                  className="hint"
                  style={{ fontSize: 10 }}
                >
                  {sub}
                </div>
              </div>
              <Icon
                name="chevron_r"
                size={14}
                color="var(--text-3)"
              />
            </div>
          ))}
        </div>
        <button
          className="btn sm"
          style={{ width: '100%', marginTop: 14 }}
          onClick={s.lock}
        >
          <Icon
            name="lock"
            size={14}
          />
          Lock wallet
        </button>
        <div
          className="hint"
          style={{ textAlign: 'center', margin: '14px 0 20px' }}
        >
          Mojito 2.0.0 · <a href="#">Support</a> · <a href="#">Docs</a>
        </div>
      </div>
    </div>
  )
}

function SettingsPage({ s, nav, page, onBack }) {
  const [sheet, setSheet] = useState(null)
  const [pw, setPw] = useState('')
  const [pw1, setPw1] = useState('')
  const [pw2, setPw2] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [rename, setRename] = useState('')
  const [node, setNode] = useState('')
  const body = {
    accounts: (
      <React.Fragment>
        <div className="card">
          {s.accounts.map((a) => (
            <div
              key={a.id}
              className="row"
              onClick={() => {
                setRename(a.name)
                setSheet({ t: 'acct', id: a.id })
              }}
            >
              <Avatar acct={a} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  {a.name}
                  {a.id === s.account.id && (
                    <span className="hint"> · active</span>
                  )}
                </div>
                <div
                  className="mono"
                  style={{ fontSize: 10, color: 'var(--text-3)' }}
                >
                  BTC {shortAddr(a.btc, 6)} · ML {shortAddr(a.ml, 6)}
                </div>
              </div>
              <Icon
                name="chevron_r"
                size={14}
                color="var(--text-3)"
              />
            </div>
          ))}
        </div>
        <button
          className="btn sm"
          style={{ width: '100%', marginTop: 10 }}
          onClick={() => {
            s.addAccount()
            nav.toast('Account created')
          }}
        >
          <Icon
            name="plus"
            size={14}
          />
          Add account
        </button>
        <div
          className="hint"
          style={{ marginTop: 10 }}
        >
          All accounts derive from the same recovery phrase (BIP44 · m/84'/0'/n'
          for BTC, m/44'/19788'/n' for ML).
        </div>
      </React.Fragment>
    ),
    security: (
      <React.Fragment>
        <div
          className="eyebrow"
          style={{ marginBottom: 6 }}
        >
          Auto-lock
        </div>
        <Seg
          value={s.autoLock}
          options={['1 min', '5 min', '15 min', '1 h', 'Never']}
          onChange={s.setAutoLock}
        />
        <div
          className="eyebrow"
          style={{ margin: '18px 0 6px' }}
        >
          Credentials
        </div>
        <div className="card">
          <div
            className="row"
            onClick={() => setSheet({ t: 'pw' })}
          >
            <Icon
              name="lock"
              size={16}
              color="var(--text-1)"
            />
            <span style={{ flex: 1, fontSize: 13 }}>Change password</span>
            <Icon
              name="chevron_r"
              size={14}
              color="var(--text-3)"
            />
          </div>
          <div
            className="row"
            onClick={() => {
              setRevealed(false)
              setPw('')
              setSheet({ t: 'seed' })
            }}
          >
            <Icon
              name="eye"
              size={16}
              color="var(--text-1)"
            />
            <span style={{ flex: 1, fontSize: 13 }}>
              Reveal recovery phrase
            </span>
            <Icon
              name="chevron_r"
              size={14}
              color="var(--text-3)"
            />
          </div>
        </div>
        <div
          className="eyebrow"
          style={{ margin: '18px 0 6px' }}
        >
          Approvals
        </div>
        <div className="card">
          <div
            className="row"
            style={{ cursor: 'default' }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13 }}>
                Require password for every transaction
              </div>
              <div
                className="hint"
                style={{ fontSize: 10 }}
              >
                Also applies to dApp requests
              </div>
            </div>
            <Switch
              on={s.pwEveryTx}
              onChange={s.setPwEveryTx}
            />
          </div>
          <div
            className="row"
            style={{ cursor: 'default' }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13 }}>Show hex data on sign requests</div>
            </div>
            <Switch
              on={s.showHex}
              onChange={s.setShowHex}
            />
          </div>
        </div>
        <button
          className="btn danger sm"
          style={{ width: '100%', marginTop: 18 }}
          onClick={() => setSheet({ t: 'reset' })}
        >
          Remove wallet from this browser
        </button>
      </React.Fragment>
    ),
    network: (
      <React.Fragment>
        <div
          className="eyebrow"
          style={{ marginBottom: 6 }}
        >
          Network
        </div>
        <Seg
          value={s.network}
          options={['Mainnet', 'Testnet']}
          onChange={(v) => {
            s.setNetwork(v)
            nav.toast(`Switched to ${v}`)
          }}
        />
        {s.network === 'Testnet' && (
          <div
            className="hint"
            style={{ marginTop: 8, color: 'var(--amber)' }}
          >
            Testnet coins have no value. Addresses start with tb1 / tmt1q.
          </div>
        )}
        <div
          className="eyebrow"
          style={{ margin: '18px 0 6px' }}
        >
          Nodes
        </div>
        <div className="card">
          {[
            ['Bitcoin', 'Electrum · electrum.mojito.io:50002', 'var(--amber)'],
            [
              'Mintlayer',
              'api.mintlayer.org · height 1,204,881',
              'var(--teal)',
            ],
          ].map(([n, d, c]) => (
            <div
              key={n}
              className="row"
              style={{ cursor: 'default' }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: c,
                  boxShadow: `0 0 8px ${c}`,
                }}
              ></span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{n}</div>
                <div
                  className="mono"
                  style={{ fontSize: 10, color: 'var(--text-3)' }}
                >
                  {d}
                </div>
              </div>
              <Tag c="green">Online</Tag>
            </div>
          ))}
        </div>
        <div
          className="field"
          style={{ marginTop: 14 }}
        >
          <label>Custom Mintlayer node (optional)</label>
          <div className="inp">
            <input
              className="mono"
              placeholder="https://node.example.org"
              value={node}
              onChange={(e) => setNode(e.target.value)}
            />
            <button
              className="act"
              disabled={!node}
              onClick={() => nav.toast('Node saved · reconnecting')}
            >
              Save
            </button>
          </div>
        </div>
      </React.Fragment>
    ),
    sites: (
      <React.Fragment>
        {s.sites.length ? (
          <div className="card">
            {s.sites.map((site) => (
              <div
                key={site.origin}
                className="row"
                onClick={() => setSheet({ t: 'site', origin: site.origin })}
              >
                <div
                  className="favicon"
                  style={{
                    background: `oklch(0.6 0.14 ${site.hue} / 0.25)`,
                    color: `oklch(0.85 0.12 ${site.hue})`,
                  }}
                >
                  {site.name[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {site.name}
                  </div>
                  <div
                    className="mono"
                    style={{ fontSize: 10, color: 'var(--text-3)' }}
                  >
                    {site.origin} · {site.accounts.length} account
                    {site.accounts.length > 1 ? 's' : ''}
                  </div>
                </div>
                <Icon
                  name="chevron_r"
                  size={14}
                  color="var(--text-3)"
                />
              </div>
            ))}
          </div>
        ) : (
          <Empty
            icon="flash"
            title="No connected sites"
            sub="Sites you approve will be listed here."
          />
        )}
        <div
          className="hint"
          style={{ marginTop: 10 }}
        >
          Connected sites can see your addresses and balances and request
          signatures. Nothing is signed without your approval.
        </div>
      </React.Fragment>
    ),
    prefs: (
      <React.Fragment>
        <div
          className="eyebrow"
          style={{ marginBottom: 6 }}
        >
          Display currency
        </div>
        <Seg
          value={s.currency}
          options={['USD', 'EUR', 'GBP', 'BTC']}
          onChange={s.setCurrency}
        />
        <div
          className="eyebrow"
          style={{ margin: '18px 0 6px' }}
        >
          Display
        </div>
        <div className="card">
          <div
            className="row"
            style={{ cursor: 'default' }}
          >
            <span style={{ flex: 1, fontSize: 13 }}>
              Hide balances by default
            </span>
            <Switch
              on={s.hideBal}
              onChange={s.setHideBal}
            />
          </div>
          <div
            className="row"
            style={{ cursor: 'default' }}
          >
            <span style={{ flex: 1, fontSize: 13 }}>
              Show hidden tokens in home
            </span>
            <Switch
              on={false}
              onChange={() => nav.toast('Use Manage assets to unhide tokens')}
            />
          </div>
          <div
            className="row"
            style={{ cursor: 'default' }}
          >
            <span style={{ flex: 1, fontSize: 13 }}>Language</span>
            <span className="hint">English</span>
            <Icon
              name="chevron_r"
              size={14}
              color="var(--text-3)"
            />
          </div>
        </div>
      </React.Fragment>
    ),
    about: (
      <React.Fragment>
        <div style={{ textAlign: 'center', padding: '10px 0 18px' }}>
          <div style={{ display: 'inline-block' }}>
            <MojitoLogo size={56} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, marginTop: 10 }}>
            Mojito
          </div>
          <div
            className="mono"
            style={{ fontSize: 11, color: 'var(--text-3)' }}
          >
            2.0.0 (build 4120) · open source
          </div>
        </div>
        <div className="card">
          {[
            ['Release notes', 'arrow_r'],
            ['Support', 'arrow_r'],
            ['Terms of use', 'arrow_r'],
            ['Privacy policy', 'arrow_r'],
          ].map(([t, i]) => (
            <div
              key={t}
              className="row"
            >
              <span style={{ flex: 1, fontSize: 13 }}>{t}</span>
              <Icon
                name={i}
                size={14}
                color="var(--text-3)"
              />
            </div>
          ))}
        </div>
      </React.Fragment>
    ),
  }[page]

  const acct =
    sheet?.t === 'acct' ? s.accounts.find((a) => a.id === sheet.id) : null
  const site =
    sheet?.t === 'site' ? s.sites.find((x) => x.origin === sheet.origin) : null
  return (
    <div
      className="layer step-in"
      data-screen-label={`Settings · ${SET_PAGES[page]}`}
    >
      <Hdr
        title={SET_PAGES[page]}
        onBack={onBack}
      />
      <div
        className="scroll pad"
        style={{ paddingBottom: 20 }}
      >
        {body}
      </div>
      <BeSheet
        open={!!sheet}
        onClose={() => setSheet(null)}
        label="Settings sheet"
        title={
          acct
            ? 'Account'
            : site
              ? site.name
              : sheet?.t === 'pw'
                ? 'Change password'
                : sheet?.t === 'seed'
                  ? 'Recovery phrase'
                  : sheet?.t === 'reset'
                    ? 'Remove wallet?'
                    : ''
        }
      >
        {acct && (
          <React.Fragment>
            <div className="field">
              <label>Name</label>
              <div className="inp">
                <input
                  value={rename}
                  onChange={(e) => setRename(e.target.value)}
                />
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <KV
                rows={[
                  ['BTC address', acct.btc],
                  ['ML address', acct.ml],
                ]}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button
                className="btn primary sm"
                style={{ flex: 1 }}
                onClick={() => {
                  s.renameAccount(acct.id, rename)
                  setSheet(null)
                  nav.toast('Renamed')
                }}
              >
                Save
              </button>
              <button
                className="btn sm"
                style={{ flex: 1 }}
                onClick={() => nav.toast('Public key copied')}
              >
                Copy xpub
              </button>
            </div>
          </React.Fragment>
        )}
        {site && (
          <React.Fragment>
            <KV
              rows={[
                ['Origin', site.origin],
                ['Connected since', site.since],
                [
                  'Accounts',
                  site.accounts
                    .map((id) => s.accounts.find((a) => a.id === id)?.name)
                    .join(', '),
                ],
              ]}
            />
            <button
              className="btn danger sm"
              style={{ width: '100%', marginTop: 12 }}
              onClick={() => {
                s.disconnect(site.origin)
                setSheet(null)
                nav.toast(`Disconnected ${site.name}`)
              }}
            >
              Disconnect
            </button>
          </React.Fragment>
        )}
        {sheet?.t === 'pw' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <PwField
              label="Current password"
              value={pw}
              onChange={setPw}
              autoFocus
            />
            <PwField
              label="New password"
              value={pw1}
              onChange={setPw1}
              placeholder="New password"
            />
            <Strength pw={pw1} />
            <PwField
              label="Confirm"
              value={pw2}
              onChange={setPw2}
              placeholder="Repeat new password"
              bad={pw2 && pw2 !== pw1}
            />
            <button
              className="btn primary sm"
              disabled={!(pw.length >= 4 && pwScore(pw1) >= 2 && pw1 === pw2)}
              onClick={() => {
                setSheet(null)
                setPw('')
                setPw1('')
                setPw2('')
                nav.toast('Password changed')
              }}
            >
              Update password
            </button>
          </div>
        )}
        {sheet?.t === 'seed' &&
          (!revealed ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: 12,
                  background: 'oklch(0.7 0.2 25 / 0.08)',
                  border: '1px solid oklch(0.7 0.2 25 / 0.25)',
                  display: 'flex',
                  gap: 10,
                }}
              >
                <Icon
                  name="shield"
                  size={16}
                  color="var(--red)"
                />
                <span
                  className="hint"
                  style={{ color: 'var(--text-1)' }}
                >
                  Never share this phrase. Anyone asking for it is trying to
                  steal your funds.
                </span>
              </div>
              <PwField
                value={pw}
                onChange={setPw}
                autoFocus
                onEnter={() => pw.length >= 4 && setRevealed(true)}
              />
              <button
                className="btn primary sm"
                disabled={pw.length < 4}
                onClick={() => setRevealed(true)}
              >
                Reveal
              </button>
            </div>
          ) : (
            <React.Fragment>
              <div className="seedgrid">
                {BE_SEED.map((w, i) => (
                  <div
                    key={i}
                    className="seedw"
                  >
                    <span className="n">{i + 1}</span>
                    {w}
                  </div>
                ))}
              </div>
              <button
                className="btn sm"
                style={{ width: '100%', marginTop: 12 }}
                onClick={() => setSheet(null)}
              >
                Done
              </button>
            </React.Fragment>
          ))}
        {sheet?.t === 'reset' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div
              className="hint"
              style={{ color: 'var(--text-1)' }}
            >
              This deletes your keys and settings from this browser. You can
              restore the wallet later only with your recovery phrase.
            </div>
            <HoldButton
              className="danger"
              label="Hold to remove wallet"
              icon="shield"
              onDone={() => {
                setSheet(null)
                s.reset()
              }}
            />
          </div>
        )}
      </BeSheet>
    </div>
  )
}

Object.assign(window, {
  ActivityScreenBE,
  TxSheet,
  SettingsScreenBE,
  SettingsPage,
})
