import React, { useEffect } from 'react'

import useStyleClasses from '../../../hooks/UseStyleClasses/useStyleClasses'

import './Button.css'

const Button = ({
  children = 'Label',
  alternate = false,
  onClickHandle = () => {},
  extraStyleClasses = [],
}) => {
  const classesList = ['btn', ...extraStyleClasses]
  alternate && classesList.push('alternate')

  const { styleClasses, addStyleClass, removeStyleClass } =
    useStyleClasses(classesList)

  useEffect(() => {
    alternate ? addStyleClass('alternate') : removeStyleClass('alternate')
  }, [alternate, addStyleClass, removeStyleClass])

  return (
    <>
      <button
        className={styleClasses}
        onClick={onClickHandle}
        data-testid="button"
      >
        {children}
      </button>
    </>
  )
}

export default Button
