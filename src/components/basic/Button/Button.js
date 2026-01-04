import React from 'react'

import './Button.css'

const Button = ({
  children = 'Label',
  alternate = false,
  dark = false,
  onClickHandle = () => {},
  extraStyleClasses = [],
  disabled = false,
  buttonType = 'button',
  dataTestId = 'button',
  onMouseEnter,
  onMouseLeave,
}) => {
  // Вычисляем классы сразу, без useEffect
  const classList = ['btn', ...extraStyleClasses]
  if (dark) {
    classList.push('dark')
  } else if (alternate) {
    classList.push('alternate')
  }
  const styleClasses = classList.join(' ')

  return (
    <button
      className={styleClasses}
      onClick={onClickHandle}
      data-testid={dataTestId}
      disabled={disabled}
      type={buttonType}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </button>
  )
}

export default Button
