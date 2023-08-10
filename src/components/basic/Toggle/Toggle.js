import { useState } from 'react'
import './Toggle.css'

const Toggle = ({ label, toggled, onClick }) => {
  const [isToggled, toggle] = useState(toggled)

  const callback = () => {
    toggle(!isToggled)
    onClick && onClick(!isToggled)
  }

  return (
    <label
      className="toggleWrapper"
      htmlFor="toggleInput"
      data-testid="toggle"
    >
      <input
        className="toggleInput"
        type="checkbox"
        checked={isToggled}
        onChange={callback}
        id="toggleInput"
        role="switch"
        aria-checked={isToggled}
        data-testid="toggle-input"
      />
      <span className="toggleMark" />
      <strong
        className="toggleLabel"
        data-testid="toggle-label"
      >
        {label}
      </strong>
    </label>
  )
}

export default Toggle
