import React, { useEffect, useRef } from 'react'

import InputListItem from './InputsListItem'

import './InputsList.css'

const isInputValid = (input, words, DefaultWordList = []) => {
  const value = input.value
  return words?.length > 0
    ? words[input.order] === value
    : DefaultWordList.includes(input.value)
}

const InputsList = ({
  fields,
  setFields,
  restoreMode,
  wordsList = [],
  BIP39DefaultWordList,
}) => {
  const effectCalled = useRef(false)

  useEffect(() => {
    if (effectCalled.current) return
    if (wordsList.length && wordsList.filter((x) => !!x).length === 0) return
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
      isInputValid(originalField, wordsList, BIP39DefaultWordList),
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
