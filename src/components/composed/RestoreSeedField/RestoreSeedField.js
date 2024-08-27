import { useState } from 'react'
import { Textarea } from '@BasicComponents'

const RestoreSeedField = ({ setFields, accountWordsValid }) => {
  const [textareaValue, setTextareaValue] = useState('')

  const onChangeHandler = ({ target }) => {
    setTextareaValue(target.value)
    const words = target.value.trim().split(' ')
    setFields(words)
  }

  const textariaSize = {
    cols: 80,
    rows: 14,
  }

  return (
    <Textarea
      value={textareaValue}
      onChange={onChangeHandler}
      id="restore-seed-textarea"
      size={textariaSize}
      validity={accountWordsValid}
    />
  )
}

export default RestoreSeedField
