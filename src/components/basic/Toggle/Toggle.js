import { useEffect, useId, useState } from 'react'
import './Toggle.css'

const Toggle = ({ label, name, toggled = false, checked, onClick }) => {
  const [isToggled, toggle] = useState(toggled)
  const isControlled = checked !== undefined
  const generatedId = useId()
  const inputId = name ?? generatedId

  useEffect(() => {
    toggle(toggled)
  }, [toggled])

  const isChecked = isControlled ? checked : isToggled

  const callback = () => {
    if (!isControlled) toggle(!isToggled)
    onClick && onClick(!isChecked)
  }

  return (
    <label
      className="toggleWrapper"
      htmlFor={inputId}
      data-testid="toggle"
    >
      <input
        className="toggleInput"
        type="checkbox"
        checked={isChecked}
        onChange={callback}
        id={inputId}
        role="switch"
        aria-checked={isChecked}
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
