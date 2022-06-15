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
  validity = '',
  id = '',
  password = false,
  pattern,
}) => {
  const classesList = ['input', ...extraStyleClasses]

  const { styleClasses, addStyleClass, removeStyleClass, setStyleClasses } =
    useStyleClasses(classesList)
  const [val, setVal] = useState(value)
  const [type, setType] = useState(password ? 'password' : 'text')

  useEffect(() => {
    setVal(value)
  }, [value])

  useEffect(() => {
    setStyleClasses(classesList)
  }, [classesList, setStyleClasses])

  useEffect(() => {
    switch (validity) {
      case 'valid':
        removeStyleClass('invalid')
        addStyleClass('valid')
        break
      case 'invalid':
        removeStyleClass('valid')
        addStyleClass('invalid')
        break
      default:
        removeStyleClass(['valid', 'invalid'])
        break
    }
  }, [validity, classesList, setStyleClasses, addStyleClass, removeStyleClass])

  useEffect(() => {
    setType(password ? 'password' : 'text')
  }, [password])

  const onChangeDefaultHandler = (ev) => {
    setVal(ev.target.value)
    onChangeHandle(ev)
  }

  return (
    <input
      type={type}
      id={id}
      placeholder={placeholder}
      value={val}
      className={styleClasses}
      onBlur={onBlurHandle}
      onFocus={onFocusHandle}
      onChange={onChangeDefaultHandler}
      data-testid="input"
      pattern={pattern}
    />
  )
}

export default Input
