import React, { useEffect, useState } from 'react'
import useStyleClasses from '../../hooks/useStyleClasses'

import './input.css'

const Input = ({
  placeholder = 'Placeholder',
  value = '',
  extraStyleClasses = [],
  onBlurHandle = () => {},
  onFocusHandle = () => {},
  onChangeHandle = () => {},
}) => {
  const classesList = ['input', ...extraStyleClasses]

  const { styleClasses } = useStyleClasses(classesList)
  const [val, setVal] = useState(value)

  useEffect(() => {
    setVal(value)
  }, [value])

  const onChangeDefaultHandler = ev => {
    setVal(ev.target.value)
    onChangeHandle(ev)
  }

  return (
    <input
      type="text"
      placeholder={placeholder}
      value={val}
      className={styleClasses}
      onBlur={onBlurHandle}
      onFocus={onFocusHandle}
      onChange={onChangeDefaultHandler}
      data-testid="input"/>
  )
}

export default Input
