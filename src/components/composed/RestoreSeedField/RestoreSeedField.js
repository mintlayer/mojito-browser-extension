// import { useState } from 'react'
import React, { useState } from 'react'

import './RestoreSeedField.css'

const RestoreSeedField = ({ setFields, accountWordsValid }) => {
  const [textareaValue, setTextareaValue] = useState('')

  const onChangeHandler = ({ target }) => {
    setTextareaValue(target.value)
    const words = target.value.trim().split(' ')
    setFields(words)
  }

  const getExtraClasses = () => {
    if (textareaValue && accountWordsValid) {
      return 'seed-valid'
    } else if (textareaValue && !accountWordsValid) {
      return 'seed-invalid'
    } else {
      return ''
    }
  }

  return (
    <textarea
      data-testid="restore-seed-textarea"
      value={textareaValue}
      onChange={onChangeHandler}
      className={`seed-textarea ${getExtraClasses()}`}
      name="textarea-seed"
      id="textarea-seed"
      cols="80"
      rows="14"
    />
  )
}

export default RestoreSeedField
