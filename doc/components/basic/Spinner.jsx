// Spinner — indeterminate ring loader. Basic: no dependencies.
// Extracted from the repeated broadcasting/discovery spinner pattern.
function Spinner({ size = 40, color = 'var(--amber)', width = 2.5 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: `${width}px solid ${color}`,
        borderTopColor: 'transparent',
        animation: 'spin-slow 0.8s linear infinite',
      }}
    ></div>
  )
}

Object.assign(window, { Spinner })
