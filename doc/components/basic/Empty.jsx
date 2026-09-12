// EmptyState — empty state with icon, title, subtitle. Composes: Icon.
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

Object.assign(window, { Empty })
