// import { useState } from 'react'
import React, { useState } from 'react'

import './RestoreSeedField.css'

const isInputValid = (words, DefaultWordList = []) => {
  if (words.length !== 12 && words.length !== 24) {
    return false
  }
  return words?.length > 0
    ? words.every((word) => DefaultWordList.includes(word))
    : false
}

const RestoreSeedField = ({
  setFields,
  BIP39DefaultWordList,
  accountWordsValid,
  setAccountWordsValid,
}) => {
  const [textareaValue, setTextareaValue] = useState('')

  const onChangeHandler = ({ target }) => {
    setTextareaValue(target.value)
    const words = target.value.trim().split(' ')
    const isValid = isInputValid(words, BIP39DefaultWordList)
    setAccountWordsValid(isValid)
    setFields(words)
  }

  return (
    <textarea
      data-testid="restore-seed-textarea"
      value={textareaValue}
      onChange={onChangeHandler}
      className={`seed-textarea ${
        textareaValue && accountWordsValid
          ? 'seed-valid'
          : textareaValue && !accountWordsValid
          ? 'seed-invalid'
          : ''
      }`}
      name="textarea-seed"
      id="textarea-seed"
      cols="80"
      rows="14"
    />
  )
}

export default RestoreSeedField
