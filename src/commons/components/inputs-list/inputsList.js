import React, { useEffect } from 'react'
import InputListItem from '../inputs-list-item/inputsListItem'
import './inputsList.css'

const isInputValid = (input, words) => {
  if (words?.length > 0) {
    const value = input.value.toLowerCase()
    return words.includes(value)
  } else {
    return true
  }
}

const InputsList = ({
  fields,
  setFields,
  restoreMode,
  amount,
  wordsList = [],
}) => {
  useEffect(() => {
    const newFields = [...Array(amount)].map((_, index) => ({
      order: index,
      validity: false,
      value: '',
    }))
    setFields(newFields)
  }, [amount, setFields])

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
            onChangeHandle={(event) => onChangeHandler(event, field.order)}
            restoreMode={restoreMode}
          />
        ))}
    </ul>
  )
}

export { isInputValid }
export default InputsList