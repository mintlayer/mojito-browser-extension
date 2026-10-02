// StatusBar — mobile status bar mock. Basic: pure SVG.
function StatusBar() {
  return (
    <div
      style={{
        height: 52,
        padding: '18px 28px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontFamily: 'Inter',
        color: 'var(--text-0)',
        fontSize: 15,
        fontWeight: 600,
        position: 'relative',
        zIndex: 5,
      }}
    >
      <span>9:41</span>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <svg
          width="17"
          height="11"
          viewBox="0 0 17 11"
          fill="none"
        >
          <rect
            x="0"
            y="7"
            width="3"
            height="4"
            rx="0.6"
            fill="currentColor"
          />
          <rect
            x="4.5"
            y="5"
            width="3"
            height="6"
            rx="0.6"
            fill="currentColor"
          />
          <rect
            x="9"
            y="2.5"
            width="3"
            height="8.5"
            rx="0.6"
            fill="currentColor"
          />
          <rect
            x="13.5"
            y="0"
            width="3"
            height="11"
            rx="0.6"
            fill="currentColor"
          />
        </svg>
        <svg
          width="15"
          height="11"
          viewBox="0 0 15 11"
          fill="none"
        >
          <path
            d="M7.5 3a7 7 0 0 1 5.5 2.5L12 6.5A5.5 5.5 0 0 0 3 6.5L2 5.5A7 7 0 0 1 7.5 3z"
            fill="currentColor"
          />
          <circle
            cx="7.5"
            cy="9"
            r="1.3"
            fill="currentColor"
          />
        </svg>
        <svg
          width="25"
          height="12"
          viewBox="0 0 25 12"
          fill="none"
        >
          <rect
            x="0.5"
            y="0.5"
            width="22"
            height="11"
            rx="3"
            stroke="currentColor"
            opacity="0.5"
          />
          <rect
            x="2"
            y="2"
            width="18"
            height="8"
            rx="1.5"
            fill="currentColor"
          />
          <rect
            x="23"
            y="4"
            width="1.5"
            height="4"
            rx="0.5"
            fill="currentColor"
            opacity="0.5"
          />
        </svg>
      </div>
    </div>
  )
}

Object.assign(window, { StatusBar })
