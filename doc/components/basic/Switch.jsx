// Switch — toggle. Basic: no dependencies.
function Switch({ on, onChange }) {
  return (
    <div
      className={'sw' + (on ? ' on' : '')}
      onClick={() => onChange(!on)}
    ></div>
  )
}

Object.assign(window, { Switch })
