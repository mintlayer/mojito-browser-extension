import React, { useEffect, useState } from 'react'
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

  useEffect(() => {
    setTextareaValue(value)
  }, [value])

  const getExtraClasses = () => {
    if (value && validity) {
      return 'textarea-valid'
    } else if (value && !validity) {
      return 'textarea-invalid'
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
      className={`textarea ${getExtraClasses()} ${extraClasses ? extraClasses : ''}`}
      name={id}
      id={id}
      cols={size.cols}
      rows={size.rows}
      readOnly={disabled}
    />
  )
}

export default Textarea
