// Mojito BE — onboarding + unlock. api: { go(screen), back(), finish(), flow, setFlow }

function Progress({ step, total }) {
  return (
    <div style={{ display: 'flex', gap: 4, flex: 1 }}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: 3,
            borderRadius: 999,
            background: i < step ? 'var(--amber)' : 'oklch(1 0 0 / 0.07)',
            boxShadow: i === step - 1 ? '0 0 8px var(--amber)' : 'none',
            transition: 'all 300ms',
          }}
        ></div>
      ))}
    </div>
  )
}
function OnbTop({ api, step, total = 4 }) {
  return (
    <div className="hdr">
      <div
        className="ib"
        onClick={api.back}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 18l-6-6 6-6"></path>
        </svg>
      </div>
      <Progress
        step={step}
        total={total}
      />
      <span
        className="mono"
        style={{ fontSize: 11, color: 'var(--text-3)' }}
      >
        {step}/{total}
      </span>
    </div>
  )
}

function WelcomeScreenBE({ api }) {
  return (
    <div
      className="layer"
      data-screen-label="Welcome"
    >
      <div
        className="scroll pad"
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            margin: '0 auto',
            animation: 'float-y 5s ease-in-out infinite',
          }}
        >
          <MojitoLogo size={88} />
        </div>
        <div
          style={{
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            marginTop: 26,
          }}
        >
          Mojito
        </div>
        <div
          style={{
            fontSize: 13,
            color: 'var(--text-2)',
            marginTop: 8,
            lineHeight: 1.6,
          }}
        >
          Self-custody wallet for Bitcoin and Mintlayer.
          <br />
          Your keys never leave this browser.
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 8,
            marginTop: 22,
          }}
        >
          <span className="chip amber">
            <span className="dot"></span>Bitcoin
          </span>
          <span className="chip teal">
            <span className="dot"></span>Mintlayer
          </span>
        </div>
      </div>
      <div
        className="pad"
        style={{
          paddingBottom: 22,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <button
          className="btn primary"
          onClick={() => {
            api.setFlow('create')
            api.go('password')
          }}
        >
          Create a new wallet
        </button>
        <button
          className="btn"
          onClick={() => {
            api.setFlow('import')
            api.go('password')
          }}
        >
          I already have a recovery phrase
        </button>
        <div
          className="hint"
          style={{ textAlign: 'center', marginTop: 4 }}
        >
          By continuing you agree to the <a href="#">Terms</a> and{' '}
          <a href="#">Privacy policy</a>.
        </div>
      </div>
    </div>
  )
}

function PasswordScreenBE({ api }) {
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [agree, setAgree] = useState(false)
  const ok = pwScore(pw) >= 2 && pw === pw2 && agree
  const mismatch = pw2 && pw2 !== pw
  return (
    <div
      className="layer"
      data-screen-label="Set password"
    >
      <OnbTop
        api={api}
        step={1}
      />
      <div className="scroll pad">
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: '-0.01em',
            marginTop: 6,
          }}
        >
          Create a password
        </div>
        <div
          className="hint"
          style={{ marginTop: 6 }}
        >
          Unlocks Mojito on this device. It cannot recover your wallet — only
          your recovery phrase can.
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            marginTop: 22,
          }}
        >
          <PwField
            label="Password"
            value={pw}
            onChange={setPw}
            autoFocus
          />
          <Strength pw={pw} />
          <PwField
            label="Confirm password"
            value={pw2}
            onChange={setPw2}
            placeholder="Repeat password"
            bad={mismatch}
          />
          {mismatch && <span className="hint bad">Passwords don't match</span>}
          <OnbCheck
            checked={agree}
            onToggle={() => setAgree((a) => !a)}
            label="I understand Mojito cannot recover this password."
          />
        </div>
      </div>
      <div
        className="pad"
        style={{ paddingBottom: 22 }}
      >
        <button
          className="btn primary"
          style={{ width: '100%' }}
          disabled={!ok}
          onClick={() => api.go(api.flow === 'create' ? 'seed' : 'import')}
        >
          Continue
        </button>
      </div>
    </div>
  )
}

function SeedScreenBE({ api }) {
  const [shown, setShown] = useState(false)
  const [saved, setSaved] = useState(false)
  const [toast, toastEl] = useToast()
  return (
    <div
      className="layer"
      data-screen-label="Recovery phrase"
    >
      <OnbTop
        api={api}
        step={2}
      />
      <div className="scroll pad">
        <div style={{ fontSize: 20, fontWeight: 700, marginTop: 6 }}>
          Your recovery phrase
        </div>
        <div
          className="hint"
          style={{ marginTop: 6 }}
        >
          24 words, generated locally from 256 bits of entropy. Write them down
          in order and store them offline.
        </div>
        <div style={{ position: 'relative', marginTop: 18 }}>
          <div className="seedgrid">
            {BE_SEED.map((w, i) => (
              <div
                key={i}
                className={'seedw' + (shown ? '' : ' blur')}
              >
                <span className="n">{i + 1}</span>
                {w}
              </div>
            ))}
          </div>
          {!shown && (
            <div
              onClick={() => setShown(true)}
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
              <span style={{ fontSize: 12, fontWeight: 600 }}>
                Tap to reveal
              </span>
              <span className="hint">
                Make sure nobody is watching your screen
              </span>
            </div>
          )}
        </div>
        {shown && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              className="btn sm"
              style={{ flex: 1 }}
              onClick={() => toast('Copied — clears from clipboard in 60s')}
            >
              Copy
            </button>
            <button
              className="btn sm"
              style={{ flex: 1 }}
              onClick={() => setShown(false)}
            >
              Hide
            </button>
          </div>
        )}
        <div
          style={{
            marginTop: 16,
            padding: '10px 12px',
            borderRadius: 12,
            background: 'oklch(0.7 0.2 25 / 0.08)',
            border: '1px solid oklch(0.7 0.2 25 / 0.25)',
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
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
            Anyone with these words controls your BTC and ML. Mojito will never
            ask for them.
          </span>
        </div>
        <div style={{ marginTop: 14 }}>
          <OnbCheck
            checked={saved}
            onToggle={() => setSaved((s) => !s)}
            label="I have written down all 24 words."
          />
        </div>
      </div>
      <div
        className="pad"
        style={{ paddingBottom: 22 }}
      >
        <button
          className="btn primary"
          style={{ width: '100%' }}
          disabled={!saved || !shown}
          onClick={() => api.go('verify')}
        >
          Verify phrase
        </button>
      </div>
      {toastEl}
    </div>
  )
}

function VerifyScreenBE({ api }) {
  const targets = useMemo(
    () => [3, 11, 19].map((i) => ({ i, w: BE_SEED[i] })),
    [],
  )
  const pool = useMemo(() => {
    const extra = ['coin', 'claim', 'army', 'atom', 'bonus', 'cactus']
    return [...targets.map((t) => t.w), ...extra].sort()
  }, [])
  const [picked, setPicked] = useState([])
  const [wrong, setWrong] = useState(null)
  const cur = targets[picked.length]
  const pick = (w) => {
    if (!cur) return
    if (w === cur.w) setPicked((p) => [...p, w])
    else {
      setWrong(w)
      setTimeout(() => setWrong(null), 450)
    }
  }
  const done = picked.length === targets.length
  return (
    <div
      className="layer"
      data-screen-label="Verify phrase"
    >
      <OnbTop
        api={api}
        step={3}
      />
      <div className="scroll pad">
        <div style={{ fontSize: 20, fontWeight: 700, marginTop: 6 }}>
          Confirm your backup
        </div>
        <div
          className="hint"
          style={{ marginTop: 6 }}
        >
          Select the requested words from your phrase.
        </div>
        <div
          className="card"
          style={{
            marginTop: 18,
            padding: 14,
            display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
            gap: 8,
          }}
        >
          {targets.map((t, k) => (
            <div
              key={t.i}
              style={{ textAlign: 'center' }}
            >
              <div className="eyebrow">Word #{t.i + 1}</div>
              <div
                className="mono"
                style={{
                  marginTop: 6,
                  height: 30,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 600,
                  background:
                    k === picked.length
                      ? 'var(--amber-soft)'
                      : 'oklch(1 0 0 / 0.04)',
                  border: `1px solid ${k === picked.length ? 'oklch(0.82 0.16 70 / 0.5)' : 'var(--line-soft)'}`,
                  color: picked[k] ? 'var(--green)' : 'var(--text-3)',
                }}
              >
                {picked[k] || '·'}
              </div>
            </div>
          ))}
        </div>
        <div
          style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 16 }}
        >
          {pool.map((w) => (
            <button
              key={w}
              className={
                'wchip' +
                (picked.includes(w) ? ' used' : '') +
                (wrong === w ? ' wrong' : '')
              }
              onClick={() => !picked.includes(w) && pick(w)}
            >
              {w}
            </button>
          ))}
        </div>
        {done && (
          <div
            className="hint ok"
            style={{ marginTop: 14, textAlign: 'center' }}
          >
            ✓ Backup verified
          </div>
        )}
      </div>
      <div
        className="pad"
        style={{ paddingBottom: 22 }}
      >
        <button
          className="btn primary"
          style={{ width: '100%' }}
          disabled={!done}
          onClick={() => api.go('done')}
        >
          Finish
        </button>
      </div>
    </div>
  )
}

function ImportScreenBE({ api }) {
  const [text, setText] = useState('')
  const words = text.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const bad = words.filter((w) => !BIP39.includes(w))
  const lenOk = [12, 15, 18, 21, 24].includes(words.length)
  const valid = lenOk && bad.length === 0 && onbChecksumOK(words)
  const status = !words.length
    ? null
    : bad.length
      ? `Unknown word${bad.length > 1 ? 's' : ''}: ${bad.slice(0, 3).join(', ')}`
      : !lenOk
        ? `${words.length} words — need 12 or 24`
        : !valid
          ? 'Invalid checksum — check the word order'
          : `Valid ${words.length}-word phrase`
  return (
    <div
      className="layer"
      data-screen-label="Import phrase"
    >
      <OnbTop
        api={api}
        step={2}
        total={3}
      />
      <div className="scroll pad">
        <div style={{ fontSize: 20, fontWeight: 700, marginTop: 6 }}>
          Import recovery phrase
        </div>
        <div
          className="hint"
          style={{ marginTop: 6 }}
        >
          Paste or type your 12 or 24 words separated by spaces. Checked locally
          against the BIP39 wordlist.
        </div>
        <textarea
          className="ta"
          style={{
            marginTop: 16,
            borderColor: !words.length
              ? undefined
              : valid
                ? 'oklch(0.78 0.16 150 / 0.6)'
                : bad.length || (lenOk && !valid)
                  ? 'var(--red)'
                  : undefined,
          }}
          placeholder="word1 word2 word3 …"
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
        ></textarea>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 8,
          }}
        >
          <span
            className={
              'hint' +
              (valid ? ' ok' : status && (bad.length || lenOk) ? ' bad' : '')
            }
          >
            {status || ' '}
          </span>
          <span
            className="mono"
            style={{ fontSize: 11, color: 'var(--text-3)' }}
          >
            {words.length}/24
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button
            className="btn sm"
            style={{ flex: 1 }}
            onClick={() => setText(ONB_DEMO.valid24)}
          >
            Paste from clipboard
          </button>
          <button
            className="btn sm ghost"
            onClick={() => setText('')}
          >
            Clear
          </button>
        </div>
      </div>
      <div
        className="pad"
        style={{ paddingBottom: 22 }}
      >
        <button
          className="btn primary"
          style={{ width: '100%' }}
          disabled={!valid}
          onClick={() => api.go('discovery')}
        >
          Import wallet
        </button>
      </div>
    </div>
  )
}

function DiscoveryScreenBE({ api }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setN((x) => Math.min(3, x + 1)), 700)
    return () => clearInterval(t)
  }, [])
  const done = n === 3
  return (
    <div
      className="layer"
      data-screen-label="Account discovery"
    >
      <OnbTop
        api={api}
        step={3}
        total={3}
      />
      <div className="scroll pad">
        <div style={{ fontSize: 20, fontWeight: 700, marginTop: 6 }}>
          {done ? 'Wallet restored' : 'Scanning for accounts…'}
        </div>
        <div
          className="hint"
          style={{ marginTop: 6 }}
        >
          Looking up used addresses on Bitcoin and Mintlayer.
        </div>
        <div
          className="card"
          style={{ marginTop: 18 }}
        >
          {ONB_ACCOUNTS.map((a, i) => (
            <div
              key={a.name}
              className="row"
              style={{
                opacity: i < n ? 1 : 0.25,
                transition: 'opacity 300ms',
                cursor: 'default',
              }}
            >
              <Avatar
                acct={{
                  name: a.name.replace('Account ', ''),
                  color: ['var(--amber)', 'var(--teal)', 'var(--violet)'][i],
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{a.name}</div>
                <div
                  className="mono"
                  style={{ fontSize: 10, color: 'var(--text-3)' }}
                >
                  {a.path}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div
                  className="mono"
                  style={{ fontSize: 12 }}
                >
                  {a.usd}
                </div>
                <div
                  className="mono"
                  style={{ fontSize: 10, color: 'var(--text-2)' }}
                >
                  {a.btc} BTC · {a.ml} ML
                </div>
              </div>
            </div>
          ))}
        </div>
        {!done && (
          <div
            style={{
              marginTop: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                border: '2px solid var(--amber)',
                borderTopColor: 'transparent',
                animation: 'spin-slow 0.8s linear infinite',
              }}
            ></div>
            <span className="hint">Found {n} of 3</span>
          </div>
        )}
      </div>
      <div
        className="pad"
        style={{ paddingBottom: 22 }}
      >
        <button
          className="btn primary"
          style={{ width: '100%' }}
          disabled={!done}
          onClick={() => api.go('done')}
        >
          Open wallet
        </button>
      </div>
    </div>
  )
}

function DoneScreenBE({ api }) {
  return (
    <div
      className="layer"
      data-screen-label="All set"
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
          title="You're all set"
          sub={
            api.flow === 'create'
              ? 'Wallet created · backup verified'
              : 'Wallet imported · 3 accounts'
          }
        />
        <div
          className="card"
          style={{ marginTop: 26 }}
        >
          {[
            [
              'Pin Mojito to your toolbar',
              'One click to approve dApp requests',
            ],
            ['Auto-lock after 15 min', 'Change anytime in Settings → Security'],
          ].map(([t, s]) => (
            <div
              key={t}
              className="row"
              style={{ cursor: 'default' }}
            >
              <Icon
                name="flash"
                size={16}
                color="var(--amber)"
              />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{t}</div>
                <div className="hint">{s}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div
        className="pad"
        style={{ paddingBottom: 22 }}
      >
        <button
          className="btn primary"
          style={{ width: '100%' }}
          onClick={api.finish}
        >
          Open Mojito
        </button>
      </div>
    </div>
  )
}

function UnlockScreenBE({ onUnlock, onForgot, reason }) {
  const [pw, setPw] = useState('')
  const [bad, setBad] = useState(false)
  const go = () => {
    if (pw.length >= 4) onUnlock()
    else {
      setBad(true)
      setTimeout(() => setBad(false), 500)
    }
  }
  return (
    <div
      className="layer"
      data-screen-label="Unlock"
    >
      <div
        className="scroll pad"
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <div style={{ margin: '0 auto' }}>
          <MojitoLogo size={64} />
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, marginTop: 20 }}>
          Welcome back
        </div>
        <div
          className="hint"
          style={{ marginTop: 4 }}
        >
          {reason || 'Enter your password to unlock'}
        </div>
        <div
          className={bad ? 'shake' : ''}
          style={{ marginTop: 24, textAlign: 'left' }}
        >
          <PwField
            value={pw}
            onChange={setPw}
            autoFocus
            bad={bad}
            onEnter={go}
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
        style={{
          paddingBottom: 22,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <button
          className="btn primary"
          style={{ width: '100%' }}
          onClick={go}
        >
          Unlock
        </button>
        <button
          className="btn ghost sm"
          onClick={onForgot}
        >
          Forgot password? Restore from phrase
        </button>
      </div>
    </div>
  )
}

Object.assign(window, {
  WelcomeScreenBE,
  PasswordScreenBE,
  SeedScreenBE,
  VerifyScreenBE,
  ImportScreenBE,
  DiscoveryScreenBE,
  DoneScreenBE,
  UnlockScreenBE,
})
