// Checkbox — square check control, optional label. Basic: no dependencies.
// Covers OnbCheck (labeled, 22px) and the dApp account-picker square (20px, no label).
function Checkbox({ checked, onToggle, label, size = 22 }) {
  const box = (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        flexShrink: 0,
        background: checked ? 'var(--amber)' : 'transparent',
        border: '1.5px solid',
        borderColor: checked ? 'var(--amber)' : 'var(--line)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#1a1208',
        fontSize: size * 0.6,
        fontWeight: 700,
        transition: 'all 150ms ease',
      }}
    >
      {checked ? '✓' : ''}
    </div>
  )
  if (!label) return box
  return (
    <button
      onClick={onToggle}
      style={{
        display: 'flex',
        gap: 11,
        alignItems: 'center',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        textAlign: 'left',
      }}
    >
      {box}
      <span style={{ fontSize: 13, color: 'var(--text-1)', fontWeight: 500 }}>
        {label}
      </span>
    </button>
  )
}

Object.assign(window, { Checkbox })
