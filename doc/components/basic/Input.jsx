// Input — the `.inp` composite: optional leading icon / prefix, input, suffix, action button. Basic: no component dependencies.
// Extracted from PwField, search, recipient, amount, token-id and custom-node inputs.
function Input({
  icon,
  iconColor,
  prefix,
  suffix,
  action,
  bad,
  ok,
  style,
  onClick,
  children,
}) {
  return (
    <div
      className={'inp' + (bad ? ' bad' : '') + (ok ? ' ok' : '')}
      style={style}
      onClick={onClick}
    >
      {icon && (
        <Icon
          name={icon}
          size={15}
          color={iconColor || 'var(--text-3)'}
        />
      )}
      {prefix}
      {children}
      {suffix}
      {action}
    </div>
  )
}

Object.assign(window, { Input })
