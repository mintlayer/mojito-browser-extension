// PinDots — 6-dot PIN entry indicator. Basic: no dependencies.
function PinDots({ value, error }) {
  return (
    <div className={error ? 'pin-dots shake' : 'pin-dots'}>
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          className="pin-dot"
          style={{
            background:
              i < value.length
                ? error
                  ? 'var(--red)'
                  : 'var(--amber)'
                : 'transparent',
            borderColor: error
              ? 'var(--red)'
              : i < value.length
                ? 'var(--amber)'
                : 'var(--line)',
            boxShadow:
              i < value.length && !error
                ? '0 0 10px oklch(0.82 0.16 70 / 0.45)'
                : 'none',
          }}
        ></div>
      ))}
    </div>
  )
}

Object.assign(window, { PinDots })
