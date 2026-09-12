// IconTile — colored rounded tile holding an icon. Basic: composes Icon.
// Extracted from TxRow / TxSheet type badges and Settings menu item icons.
function IconTile({
  icon,
  color = 'var(--text-1)',
  size = 32,
  radius = 10,
  bg,
  children,
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: bg || `oklch(from ${color} l c h / 0.14)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {icon ? (
        <Icon
          name={icon}
          size={size * 0.47}
          color={color}
        />
      ) : (
        children
      )}
    </div>
  )
}

Object.assign(window, { IconTile })
