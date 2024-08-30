import React, { useState } from 'react'
import './Textarea.css'

const Textarea = ({
  value,
  onChange,
  extraClasses,
  id,
  size,
  validity = true,
  disabled,
}) => {
  const [textareaVakue, setTextareaValue] = useState(value ? value : '')

  const getExtraClasses = () => {
    if (value && validity) {
      return 'textaria-valid'
    } else if (value && !validity) {
      return 'textaria-invalid'
    } else {
      return ''
    }
  }
  const onChangeHandler = ({ target }) => {
    onChange && onChange({ target })
    setTextareaValue(target.value)
    getExtraClasses()
  }

  return (
    <textarea
      data-testid={id}
      value={textareaVakue}
      onChange={onChangeHandler}
      className={`textarea ${getExtraClasses()} ${extraClasses}`}
      name={id}
      id={id}
      cols={size.cols}
      rows={size.rows}
      readOnly={disabled}
    />
  )
}

export default Textarea
