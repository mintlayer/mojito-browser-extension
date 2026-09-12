// Row — list item inside a Card: left node, title/sub middle, right slot. Basic: no component dependencies.
// Extracted from the ubiquitous `.row` pattern (accounts, assets, settings, sites, activity).
function Row({
  left,
  title,
  sub,
  right,
  onClick,
  style,
  className = '',
  children,
}) {
  return (
    <div
      className={'row' + (className ? ' ' + className : '')}
      style={style}
      onClick={onClick}
    >
      {left}
      {children !== undefined ? (
        children
      ) : (
        <React.Fragment>
          <div style={{ flex: 1, minWidth: 0 }}>
            {title && (
              <div style={{ fontSize: 13, fontWeight: 600 }}>{title}</div>
            )}
            {sub && (
              <div
                className="mono"
                style={{ fontSize: 10, color: 'var(--text-3)' }}
              >
                {sub}
              </div>
            )}
          </div>
          {right}
        </React.Fragment>
      )}
    </div>
  )
}

Object.assign(window, { Row })
