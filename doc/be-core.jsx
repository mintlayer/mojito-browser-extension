// Mojito BE — shared primitives (uses components.jsx: Icon, TokenIcon, ChainBadge, Sparkline, LivePill, MojitoLogo)

function Hdr({ title, onBack, onClose, right }) {
  return (
    <div className="hdr">
      {onBack ? (
        <div
          className="ib"
          onClick={onBack}
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
      ) : (
        <div className="ib ghost"></div>
      )}
      <h1>{title}</h1>
      {right ? (
        right
      ) : onClose ? (
        <div
          className="ib"
          onClick={onClose}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M6 6l12 12M18 6L6 18"></path>
          </svg>
        </div>
      ) : (
        <div className="ib ghost"></div>
      )}
    </div>
  )
}

function Switch({ on, onChange }) {
  return (
    <div
      className={'sw' + (on ? ' on' : '')}
      onClick={() => onChange(!on)}
    ></div>
  )
}

function Seg({ value, options, onChange }) {
  return (
    <div className="seg">
      {options.map((o) => {
        const [v, l] = Array.isArray(o) ? o : [o, o]
        return (
          <button
            key={v}
            className={value === v ? 'on' : ''}
            onClick={() => onChange(v)}
          >
            {l}
          </button>
        )
      })}
    </div>
  )
}

function Tag({ c = 'grey', children }) {
  return <span className={'tag ' + c}>{children}</span>
}

function KV({ rows }) {
  return (
    <div
      className="card"
      style={{ padding: '2px 14px' }}
    >
      {rows.map(([k, v]) => (
        <div
          className="kv"
          key={k}
        >
          <span className="k">{k}</span>
          <span className="v">{v}</span>
        </div>
      ))}
    </div>
  )
}

// Modal sheet inside the popup
function BeSheet({ open, onClose, title, children, label }) {
  if (!open) return null
  return (
    <div
      style={{ position: 'absolute', inset: 0, zIndex: 60 }}
      data-screen-label={label || title || 'Sheet'}
    >
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'oklch(0 0 0 / 0.55)',
          animation: 'fade-in 200ms ease forwards',
        }}
      ></div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          maxHeight: '88%',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-1)',
          borderTop: '1px solid var(--line-soft)',
          borderRadius: '20px 20px 0 0',
          padding: '10px 18px 18px',
          animation: 'sheet-up 260ms cubic-bezier(.2,1,.4,1) forwards',
        }}
      >
        <div
          style={{
            width: 36,
            height: 4,
            borderRadius: 999,
            background: 'var(--line)',
            margin: '0 auto 12px',
            flexShrink: 0,
          }}
        ></div>
        {title && (
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
            {title}
          </div>
        )}
        <div className="scroll">{children}</div>
      </div>
    </div>
  )
}

function useToast() {
  const [msg, setMsg] = useState(null)
  const show = (m) => {
    setMsg(m)
    clearTimeout(show.t)
    show.t = setTimeout(() => setMsg(null), 1800)
  }
  const el = msg ? <div className="toast">{msg}</div> : null
  return [show, el]
}

// Hold-to-confirm primary button
function HoldButton({ label, onDone, className = 'primary', icon = 'lock' }) {
  const [go, setGo] = useState(false)
  const t = useRef(null)
  const start = () => {
    setGo(true)
    t.current = setTimeout(() => {
      setGo(false)
      onDone()
    }, 1100)
  }
  const stop = () => {
    clearTimeout(t.current)
    setGo(false)
  }
  return (
    <button
      className={`btn ${className} hold ${go ? 'go' : ''}`}
      style={{ width: '100%' }}
      onMouseDown={start}
      onMouseUp={stop}
      onMouseLeave={stop}
      onTouchStart={start}
      onTouchEnd={stop}
      onClick={(e) => e.detail === 0 && onDone()}
    >
      <span className="fill"></span>
      <span
        style={{
          position: 'relative',
          display: 'inline-flex',
          gap: 8,
          alignItems: 'center',
        }}
      >
        <Icon
          name={icon}
          size={14}
          color="currentColor"
        />
        {go ? 'Keep holding…' : label}
      </span>
    </button>
  )
}

// Password field with reveal
function PwField({
  label,
  value,
  onChange,
  placeholder = 'Password',
  autoFocus,
  bad,
  onEnter,
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="field">
      {label && <label>{label}</label>}
      <div className={'inp' + (bad ? ' bad' : '')}>
        <Icon
          name="lock"
          size={15}
          color="var(--text-3)"
        />
        <input
          type={show ? 'text' : 'password'}
          value={value}
          placeholder={placeholder}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onEnter && onEnter()}
        />
        <span
          onClick={() => setShow((s) => !s)}
          style={{ cursor: 'pointer', display: 'flex' }}
        >
          <Icon
            name={show ? 'eye_off' : 'eye'}
            size={15}
            color="var(--text-2)"
          />
        </span>
      </div>
    </div>
  )
}

function pwScore(p) {
  let s = 0
  if (p.length >= 8) s++
  if (p.length >= 12) s++
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++
  if (/\d/.test(p)) s++
  if (/[^\w]/.test(p)) s++
  return Math.min(4, s)
}
function Strength({ pw }) {
  const s = pw ? pwScore(pw) : 0
  const c = ['', 'var(--red)', 'var(--amber)', 'var(--amber)', 'var(--green)'][
    s
  ]
  const lbl = ['', 'Weak', 'Fair', 'Good', 'Strong'][s]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div className="strength">
        {[1, 2, 3, 4].map((i) => (
          <i
            key={i}
            style={{ background: i <= s ? c : undefined }}
          ></i>
        ))}
      </div>
      {pw && (
        <span
          className="hint"
          style={{ color: c }}
        >
          {lbl}
          {s < 2 ? ' · use 8+ characters, mixed case and a number' : ''}
        </span>
      )}
    </div>
  )
}

// Account avatar
function Avatar({ acct, size = 28 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        flexShrink: 0,
        background: `linear-gradient(135deg, ${acct.color}, oklch(from ${acct.color} calc(l - 0.15) c h))`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#1a1208',
        font: `700 ${size * 0.42}px Inter, sans-serif`,
      }}
    >
      {acct.name[0]}
    </div>
  )
}

// Success burst
function Success({ title, sub, children }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '28px 0 0',
        animation: 'fade-in 400ms ease both',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: 84,
          height: 84,
          margin: '0 auto',
        }}
      >
        {[0, 0.3].map((d, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '1px solid oklch(0.78 0.16 150 / 0.6)',
              animation: `pulse-ring 1.6s ${d}s ease-out infinite`,
            }}
          ></div>
        ))}
        <div
          style={{
            width: 84,
            height: 84,
            borderRadius: '50%',
            background: 'oklch(0.78 0.16 150 / 0.18)',
            border: '1.5px solid var(--green)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--green)',
            fontSize: 36,
            fontWeight: 700,
            boxShadow: '0 0 32px oklch(0.78 0.16 150 / 0.4)',
          }}
        >
          ✓
        </div>
      </div>
      <div style={{ fontSize: 21, fontWeight: 700, marginTop: 18 }}>
        {title}
      </div>
      {sub && (
        <div
          className="mono"
          style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 5 }}
        >
          {sub}
        </div>
      )}
      {children}
    </div>
  )
}

// QR placeholder (striped, labelled — real QR is rendered by the extension)
function QrPlaceholder({ size = 168, label = 'QR code' }) {
  return (
    <div
      className="ph"
      style={{ width: size, height: size, margin: '0 auto', borderRadius: 18 }}
    >
      {label}
    </div>
  )
}

function Empty({ icon = 'history', title, sub }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '36px 20px',
        color: 'var(--text-2)',
      }}
    >
      <Icon
        name={icon}
        size={28}
        color="var(--text-3)"
      />
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--text-1)',
          marginTop: 10,
        }}
      >
        {title}
      </div>
      {sub && (
        <div
          className="hint"
          style={{ marginTop: 4 }}
        >
          {sub}
        </div>
      )}
    </div>
  )
}

const txIcon = {
  receive: ['arrow_dn', 'var(--green)'],
  send: ['arrow_up', 'var(--amber)'],
  mint: ['plus', 'var(--teal)'],
  nft: ['card', 'var(--violet)'],
  dapp: ['flash', 'var(--violet)'],
  burn: ['flash', 'var(--red)'],
}

Object.assign(window, {
  Hdr,
  Switch,
  Seg,
  Tag,
  KV,
  BeSheet,
  useToast,
  HoldButton,
  PwField,
  pwScore,
  Strength,
  Avatar,
  Success,
  QrPlaceholder,
  Empty,
  txIcon,
})
