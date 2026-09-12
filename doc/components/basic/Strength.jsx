// Strength — password strength meter. Composes: pwScore.
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

Object.assign(window, { Strength })
