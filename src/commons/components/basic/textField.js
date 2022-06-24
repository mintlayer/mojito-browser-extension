import React, { useId, useEffect, useState } from 'react'
import useStyleClasses from '../../hooks/useStyleClasses'
import Input from '../basic/input'
import VerticalGroup from '../group/verticalGroup'
import './textField.css'

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
  errorMessages
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
    if (isPristine) return

    validity
      ? setFieldValidity('valid')
      : setFieldValidity('invalid')
  }, [validity, isPristine])

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
        onChangeHandle={(e) => onChangeHandle(e.target.value)}
        validity={fieldValidity}
        pattern={pattern}
        extraStyleClasses={extraStyleClasses}
        onBlurHandle={setPristineState}
      />
      {errorMessages && !isPristine && (
        <div className="errorMessage">
          {Array.isArray(errorMessages)
          ? errorMessages.map((message) => (
            <p key={message.trim()}>{message}</p>
          ))
          : <p key={errorMessages.trim()}>{errorMessages}</p>
          }
        </div>
      )}
    </VerticalGroup>
  )
}

export default TextField
