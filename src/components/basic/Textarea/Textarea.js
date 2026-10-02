import React, { useState } from 'react'
import './Textarea.css'

const Textarea = ({
  value,
  onChange,
  extraClasses,
  id,
  size = { cols: 20, rows: 2 },
  validity = true,
  disabled,
  ...rest
}) => {
  const [textareaValue, setTextareaValue] = useState(value ? value : '')
  const [prevValue, setPrevValue] = useState(value)

  if (value !== prevValue) {
    setPrevValue(value)
    setTextareaValue(value ?? '')
  }

  const getExtraClasses = () => {
    if (value && validity) {
      return 'textarea-valid'
    } else if (value && !validity) {
      return 'textarea-invalid'
    } else {
      return ''
    }
  }
  const onChangeHandler = (event) => {
    const newValue = event.target.value
    setTextareaValue(newValue)
    onChange && onChange({ target: { value: newValue } })
  }

  return (
    <textarea
      data-testid={id}
      value={textareaValue}
      onChange={onChangeHandler}
      className={`textarea ${getExtraClasses()} ${extraClasses ? extraClasses : ''}`}
      name={id}
      id={id}
      cols={size.cols}
      rows={size.rows}
      readOnly={disabled}
      {...rest}
    />
  )
}

export default Textarea
