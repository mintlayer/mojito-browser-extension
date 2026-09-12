// Field — labelled form field wrapper. Basic: no dependencies.
function Field({ label, children, style }) {
  return (
    <div
      className="field"
      style={style}
    >
      {label && <label>{label}</label>}
      {children}
    </div>
  )
}

Object.assign(window, { Field })
