import React, { useId, useEffect } from 'react'
import useStyleClasses from '../../hooks/useStyleClasses'
import Input from '../basic/input'
import VerticalGroup from '../group/verticalGroup'

import './textField.css'

const TextField = ({
  label = 'Label',
  placeHolder = 'Placeholder',
  alternate = false,
  password = false,
}) => {
  const inputId = useId()
  const { styleClasses, addStyleClass, removeStyleClass } =
    useStyleClasses('inputLabel')

  useEffect(() => {
    alternate ? addStyleClass('alternate') : removeStyleClass('alternate')
  }, [alternate, addStyleClass, removeStyleClass])

  return (
    <VerticalGroup bigGap>
      <label htmlFor={inputId} className={styleClasses} data-testid="label">
        {label}
      </label>
      <Input id={inputId} placeholder={placeHolder} password={password} />
    </VerticalGroup>
  )
}

export default TextField
