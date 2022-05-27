import React, { useEffect, useState } from 'react'
import InputListItem from '../inputs-list-item/inputsListItem'
import './inputsList.css'

const isInputValid = (input, words) => {
  const value = input.value
  return (value.length > 0 && words.includes(value))
}

const InputsList = ({
  restoreMode,
  amount,
  wordsList = []
}) => {
  const [ fields, setFields ] = useState([])

  useEffect(() => {
    const newFields = [...Array(amount)].map((_, index) => ({ order: index, validity: false, value: '' }))
    setFields(newFields)
  }, [amount])

  const getFieldByIndex = index => fields[index]

  const setFieldValidity = (field, validity) => ({ ...field, validity })

  const onChangeHandler = ({target}, index) => {
    const originalField = getFieldByIndex(index)
    originalField.value = target.value

    const validatedField = setFieldValidity(originalField, isInputValid(originalField, wordsList))
    const newFields = [...fields]
    newFields[index] = validatedField

    setFields(newFields)
  }

  return (
    <ul className="inputs-list" data-testid="inputs-list">
      {fields.map((field) =>
        <InputListItem
          data-testid="inputs-list-item"
          key={`word-${field.order}`}
          number={field.order + 1}
          validity = {field.validity ? 'valid' : 'invalid'}
          value={field.value}
          onChangeHandle={event => onChangeHandler(event, field.order)}
          restoreMode={restoreMode}
        />
      )}
    </ul>
  )
}

export {isInputValid} // export for testing
export default InputsList
