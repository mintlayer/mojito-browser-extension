import React from 'react'
import useStyleClasses from '../../hooks/useStyleClasses'

import './button.css'

const Button = ({
  children,
  onClickHandle = () => {},
  extraStyleClasses = []
}) => {
  const styleClasses = useStyleClasses(['btn', ...extraStyleClasses])

  return (
    <>
      <button
        className={styleClasses}
        onClick={onClickHandle}
        data-testid="button">
        {children}
      </button>
    </>
  )
}

export default Button
