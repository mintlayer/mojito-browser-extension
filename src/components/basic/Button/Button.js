import React, { useEffect } from 'react'

import { useStyleClasses } from '@Hooks'

import './Button.css'

const Button = ({
  children = 'Label',
  alternate = false,
  dark = false,
  onClickHandle = () => {},
  extraStyleClasses = [],
  disabled = false,
}) => {
  const classesList = ['btn', ...extraStyleClasses]
  alternate && classesList.push('alternate')
  const { styleClasses, addStyleClass, removeStyleClass } =
    useStyleClasses(classesList)

  useEffect(() => {
    dark ? addStyleClass('dark') : removeStyleClass('dark')
    if (dark) return
    alternate ? addStyleClass('alternate') : removeStyleClass('alternate')
  }, [alternate, dark, addStyleClass, removeStyleClass])

  return (
    <>
      <button
        className={styleClasses}
        onClick={onClickHandle}
        data-testid="button"
        disabled={disabled}
      >
        {children}
      </button>
    </>
  )
}

export default Button
