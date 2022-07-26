import React, { useEffect, useState, useMemo } from 'react'
import InputMask from 'react-input-mask'

import { useStyleClasses } from '@Hooks'

import './Input.css'

const INPUT_MASKS = {
  INTEGER: /([0-9]+)/,
  FLOAT: /(([0-9]{1,})$|([0-9]{1,3}\.?)*|([0-9]{1,3}))(,[0-9]{0,2})?(.{0,})/,
}

const INPUTMASKS = {
  INTEGER: 'INTEGER',
  FLOAT: 'FLOAT',
}

export { INPUTMASKS }

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
}) => {
  const classesList = useMemo(
    () => ['input', ...extraStyleClasses],
    [extraStyleClasses],
  )

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

  const getMaskValue = (matchedValue, mask) => {
    switch (mask) {
      case 'INTEGER':
        return matchedValue[1]
      case 'FLOAT':
        return `${matchedValue[1]}${matchedValue[5] || ''}`
      default:
        return ''
    }
  }

  const onChangeDefaultHandler = (ev) => {
    const {
      target: { value },
    } = ev

    let newValue = value
    if (mask) {
      const matchedValue = value.match(INPUT_MASKS[mask])
      console.log(matchedValue)
      newValue =
        matchedValue && matchedValue[1] ? getMaskValue(matchedValue, mask) : ''
    }

    ev.target.value = newValue
    setVal(newValue)
    onChangeHandle(ev)
  }

  return (
    <InputMask
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
    />
  )
}

export default Input
