// Card — rounded surface container. Basic: no dependencies.
// Extracted from the `<div className="card" ...>` pattern used in every list/section.
function Card({ children, onClick, style, className = '' }) {
  return (
    <div
      className={'card' + (className ? ' ' + className : '')}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

Object.assign(window, { Card })
