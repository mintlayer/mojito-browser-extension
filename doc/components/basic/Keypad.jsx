// Keypad — numeric keypad with delete and corner slot. Basic: no dependencies.
function Keypad({ onKey, onDel, corner, disabled }) {
  return (
    <div
      className="kp"
      style={{
        opacity: disabled ? 0.35 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
      }}
    >
      {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((k) => (
        <button
          key={k}
          className="kp-key"
          onClick={() => onKey(k)}
        >
          {k}
        </button>
      ))}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {corner || null}
      </div>
      <button
        className="kp-key"
        onClick={() => onKey('0')}
      >
        0
      </button>
      <button
        className="kp-key kp-del"
        onClick={onDel}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 4H8l-7 8 7 8h13a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1z"></path>
          <path d="M18 9l-6 6M12 9l6 6"></path>
        </svg>
      </button>
    </div>
  )
}

Object.assign(window, { Keypad })
