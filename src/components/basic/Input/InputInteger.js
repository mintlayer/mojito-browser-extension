import { Expressions } from '@Constants'
import Input from './Input'

const InputInteger = (props) => {
  const mask = Expressions.FIELDS.INTEGER

  const parseValue = ({ target: { value, matchedValue } }) => {
    const newValue = matchedValue[1]
    console.log(newValue)
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
      getMaskedValue={getMaskedValue}
      justNumbers
    />
  )
}

export default InputInteger
