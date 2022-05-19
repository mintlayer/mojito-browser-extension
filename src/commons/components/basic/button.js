import React from 'react'
import useStyleClasses from '../../hooks/useStyleClasses'

import './button.css'

const Button = ({
  children,
  alternate = false,
  onClickHandle = () => {},
  extraStyleClasses = []
}) => {
  const classesList = ['btn', ...extraStyleClasses]
  alternate && classesList.push('alternate')

  const styleClasses = useStyleClasses(classesList)

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
