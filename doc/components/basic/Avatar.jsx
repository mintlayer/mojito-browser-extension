// Avatar — account avatar with gradient from account color. Basic: no dependencies.
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

Object.assign(window, { Avatar })
