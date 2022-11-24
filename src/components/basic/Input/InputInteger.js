import { useEffect, useState } from 'react'
import Input from './Input'

import { Expressions } from '@Constants'
import { NumbersHelper } from '@Helpers'

const InputInteger = (props) => {
  const mask = Expressions.FIELDS.INTEGER
  const [value, setValue] = useState(0)

  useEffect(() => {
    setValue(~~props.value)
    !NumbersHelper.isInteger(props.value) &&
      console.warn(
        'A non-integer value was passed to InputInteger. Is has been converted to integer.',
      )
  }, [props.value])

  const parseValue = ({ target: { value, matchedValue } }) => {
    const newValue = matchedValue[1]
    const response = { originalValue: value, value: newValue }
    if (!newValue) return { ...response, parsedValue: 0 }

    return { ...response, parsedValue: parseInt(newValue) }
  }

  const getMaskedValue = (ev) => {
    const parsedValue = parseValue(ev)
    ev.target.parsedValue = parsedValue.parsedValue
    ev.target.originalValue = parsedValue.originalValue
    return parsedValue.value || ev.target.value
  }

  return (
    <Input
      {...props}
      mask={mask}
      value={value}
      getMaskedValue={getMaskedValue}
      justNumbers
    />
  )
}

export default InputInteger
