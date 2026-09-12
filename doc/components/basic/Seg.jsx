// Seg — segmented control. Basic: no dependencies.
function Seg({ value, options, onChange }) {
  return (
    <div className="seg">
      {options.map((o) => {
        const [v, l] = Array.isArray(o) ? o : [o, o]
        return (
          <button
            key={v}
            className={value === v ? 'on' : ''}
            onClick={() => onChange(v)}
          >
            {l}
          </button>
        )
      })}
    </div>
  )
}

Object.assign(window, { Seg })
