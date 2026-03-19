import { useState } from 'react'
import { Textarea } from '@BasicComponents'

import './RestoreSeedField.css'

const RestoreSeedField = ({ setFields, accountWordsValid }) => {
  const [textareaValue, setTextareaValue] = useState('')
  const [wordCount, setWordCount] = useState(0)

  const onChangeHandler = ({ target }) => {
    setTextareaValue(target.value)
    const words = target.value.trim().split(/\s+/).filter(Boolean)
    setWordCount(words.length)
    setFields(words)
  }

  const textariaSize = {
    cols: 80,
    rows: 14,
  }

  const getCounterLabel = () => {
    if (wordCount === 0) return null
    if (wordCount <= 12) return `${wordCount} / 12`
    if (wordCount <= 24) return `${wordCount} / 24`
    return `${wordCount} / 24`
  }

  const counterLabel = getCounterLabel()

  return (
    <div className="seed-field-wrapper">
      <Textarea
        value={textareaValue}
        onChange={onChangeHandler}
        id="restore-seed-textarea"
        size={textariaSize}
        validity={accountWordsValid}
      />
      {counterLabel && (
        <p
          className={`seed-word-counter${accountWordsValid ? ' counter-valid' : ''}`}
          data-testid="seed-word-counter"
        >
          {counterLabel}
        </p>
      )}
    </div>
  )
}

export default RestoreSeedField
