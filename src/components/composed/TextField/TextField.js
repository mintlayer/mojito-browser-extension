import React, { useId, useEffect, useState } from 'react'

import { Input, Error } from '@BasicComponents'
import { VerticalGroup } from '@LayoutComponents'
import { useStyleClasses } from '@Hooks'

import './TextField.css'

const TextField = ({
  label,
  placeHolder = 'Placeholder',
  alternate = false,
  password = false,
  value,
  onChangeHandle,
  validity,
  pattern,
  extraStyleClasses,
  errorMessages,
  pristinity = true,
  reference,
  focus = false,
}) => {
  const inputId = useId()

  const { styleClasses, addStyleClass, removeStyleClass } =
    useStyleClasses('inputLabel')
  const [isPristine, setIsPristine] = useState(true)
  const [fieldValidity, setFieldValidity] = useState(null)

  useEffect(() => {
    alternate ? addStyleClass('alternate') : removeStyleClass('alternate')
  }, [alternate, addStyleClass, removeStyleClass])

  useEffect(() => {
    if (isPristine || validity === null) return
    validity ? setFieldValidity('valid') : setFieldValidity('invalid')
  }, [validity, isPristine])

  useEffect(() => {
    setIsPristine(pristinity)
  }, [pristinity])

  const setPristineState = (e) => setIsPristine(false)

  return (
    <VerticalGroup bigGap>
      {label && (
        <label
          htmlFor={inputId}
          className={styleClasses}
          data-testid="label"
        >
          {label}
        </label>
      )}
      <Input
        id={inputId}
        placeholder={placeHolder}
        password={password}
        value={value}
        onChangeHandle={(e) => onChangeHandle && onChangeHandle(e.target.value)}
        validity={fieldValidity}
        pattern={pattern}
        extraStyleClasses={extraStyleClasses}
        onBlurHandle={setPristineState}
        focus
      />
      {errorMessages && !isPristine && <Error error={errorMessages} />}
    </VerticalGroup>
  )
}

export default TextField
