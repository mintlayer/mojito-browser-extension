// Eyebrow — small uppercase section label. Basic: no dependencies.
// Extracted from the repeated `<div className="eyebrow">Section</div>` pattern.
function Eyebrow({ children, style }) {
  return (
    <div
      className="eyebrow"
      style={style}
    >
      {children}
    </div>
  )
}

Object.assign(window, { Eyebrow })
