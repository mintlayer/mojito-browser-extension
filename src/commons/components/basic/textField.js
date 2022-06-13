import React, { useId, useEffect } from 'react'
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
}) => {
  const inputId = useId()
  const { styleClasses, addStyleClass, removeStyleClass } =
    useStyleClasses('inputLabel')

  useEffect(() => {
    alternate ? addStyleClass('alternate') : removeStyleClass('alternate')
  }, [alternate, addStyleClass, removeStyleClass])
  const fieldValid = validity ? 'valid' : 'invalid'
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
        validity={fieldValid}
        pattern={pattern}
        extraStyleClasses={extraStyleClasses}
      />
    </VerticalGroup>
  )
}

export default TextField
