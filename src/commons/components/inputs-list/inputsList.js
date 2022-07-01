import React, { useEffect, useRef } from 'react'
import { getWordList } from '../../crypto/btc'
import InputListItem from '../inputs-list-item/inputsListItem'
import './inputsList.css'

const BIP39DefaultWordList = getWordList()

const isInputValid = (input, words) => {
  const value = input.value
  return words?.length > 0
    ? words[input.order] === value
    : BIP39DefaultWordList.includes(input.value)
}

const InputsList = ({ fields, setFields, restoreMode, wordsList = [] }) => {
  const effectCalled = useRef(false)

  useEffect(() => {
    if (effectCalled.current) return
    effectCalled.current = true

    let newFields
    if (wordsList.length) {
      newFields = wordsList.map((word, index) => ({
        order: index,
        validity: false,
        value: restoreMode ? '' : word,
      }))
    } else {
      newFields = [...new Array(12)].map((word, index) => ({
        order: index,
        validity: false,
        value: '',
      }))
    }

    setFields(newFields)
  }, [wordsList, setFields, restoreMode])

  const getFieldByIndex = (index) => fields[index]

  const setFieldValidity = (field, validity) => ({ ...field, validity })

  const onChangeHandler = ({ target }, index) => {
    const originalField = getFieldByIndex(index)
    originalField.value = target.value

    const validatedField = setFieldValidity(
      originalField,
      isInputValid(originalField, wordsList),
    )
    const newFields = [...fields]
    newFields[index] = validatedField

    setFields(newFields)
  }

  return (
    <ul
      className="inputs-list"
      data-testid="inputs-list"
    >
      {fields &&
        fields.map((field) => (
          <InputListItem
            data-testid="inputs-list-item"
            key={`word-${field.order}`}
            number={field.order + 1}
            validity={field.validity ? 'valid' : 'invalid'}
            value={field.value}
            onChangeHandle={(e) => onChangeHandler(e, field.order)}
            restoreMode={restoreMode}
          />
        ))}
    </ul>
  )
}

export { isInputValid }
export default InputsList
