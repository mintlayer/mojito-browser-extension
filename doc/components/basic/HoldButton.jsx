// HoldButton — hold-to-confirm button. Composes: Icon.
const { useState, useRef } = React

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

Object.assign(window, { HoldButton })
