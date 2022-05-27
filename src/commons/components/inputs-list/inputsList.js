import React, { useEffect, useState } from 'react'
import InputListItem from '../inputs-list-item/inputsListItem'
import './inputsList.css'

const isInputValid = (input, words) => {
  const value = input.value
  return (value.length > 0 && words.includes(value))
}

const InputsList = ({restoreMode, amount, wordsList}) => {
  const [ fields, setFields ] = useState([])
  const [ words ] = useState(wordsList)

  useEffect(() => {
    const newFields = [...Array(amount)].map((_, index) => ({ order: index, validity: false, value: '' }))
    setFields(newFields)
  }, [amount])

  const getFieldByIndex = index => fields[index]

  const setFieldValidity = (index, validity) => ({ ...getFieldByIndex(index), validity })

  /* istanbul ignore next */
  const onChangeHandler = ({target}, index) => {
    const validatedField = setFieldValidity(index, isInputValid(target, words))
    validatedField.value = target.value
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
