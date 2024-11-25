import React, { useEffect, useState, useMemo, useRef } from 'react'

import { useStyleClasses } from '@Hooks'

import './Input.css'

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
  disabled = false,
  mask = '',
  getMaskedValue,
  justNumbers = false,
  focus,
  readonly,
}) => {
  const classesList = useMemo(
    () => ['input', ...extraStyleClasses],
    [extraStyleClasses],
  )

  const { styleClasses, addStyleClass, removeStyleClass, setStyleClasses } =
    useStyleClasses(classesList)
  const [val, setVal] = useState(value)
  const [type, setType] = useState(password ? 'password' : 'text')
  const ref = useRef(false)

  useEffect(() => {
    if (focus && ref.current) ref.current.focus()
  }, [focus])

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
    const {
      target: { value },
    } = ev

    if (justNumbers && value.match(/[^0-9,.]/)) return false

    let newValue = password ? value : value.toString().trim()
    if (mask && getMaskedValue) {
      const matchedValue = value.match(mask)
      ev.target.matchedValue = matchedValue
      newValue = matchedValue ? getMaskedValue(ev) : ''
    }

    ev.target.value = newValue
    setVal(newValue)
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
      disabled={disabled ? 'disabled' : ''}
      ref={ref}
      readOnly={readonly}
    />
  )
}

export default Input
