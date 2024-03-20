import { useEffect, useState, useContext } from 'react'
import { AppInfo, Expressions } from '@Constants'
import { NumbersHelper } from '@Helpers'
import Input from './Input'

import { TransactionContext } from '@Contexts'

const InputBTC = (props) => {
  const { transactionMode } = useContext(TransactionContext)
  const mask = Expressions.FIELDS.BTC.getExpression(
    AppInfo.decimalSeparator,
    AppInfo.thousandsSeparator,
  )

  const [regexIntegerPartIndex, regexDecimalPartIndex] = [1, 5]
  const breakersRegex = /[.,]/g

  const [value, setValue] = useState(props.value || '')

  const removeBreakers = (value) => value.replaceAll(breakersRegex, '')

  // TODO: Refactor this Fn
  const parseCommasAndDots = (string) =>
    [...string]
      .map((char, idx) => ({ char, index: idx }))
      .filter((char) => char.char.match(breakersRegex))
      .reduce((acc, char) => {
        acc = acc || {}
        acc[char.char] = acc[char.char] || []
        acc[char.char].push(char.index)
        acc.count = acc.count ? acc.count + 1 : 1
        return acc
      }, null)

  const parseValue = ({ target }) => {
    const { selectionStart, value, matchedValue } = target
    const response = { originalValue: value }
    if (!value) return { ...response, parsedValue: 0 }

    const maskBreakers = parseCommasAndDots(value)
    if (!maskBreakers) return { ...response, parsedValue: parseInt(value) }

    const [originalIntegerPart, originalDecimalPart] = [
      matchedValue[regexIntegerPartIndex],
      matchedValue[regexDecimalPartIndex] || '',
    ]
    const [integerPart, decimalPart] = [
      removeBreakers(originalIntegerPart),
      removeBreakers(originalDecimalPart),
    ]

    const safeIntegerPart = NumbersHelper.getSafeIntegerPart(integerPart)
    const maxIntStringLength =
      NumbersHelper.SAFE_INTEGER_LENGTH +
      (maskBreakers[AppInfo.thousandsSeparator]?.length || 0)
    let newValue = `${originalIntegerPart.substring(
      0,
      maxIntStringLength,
    )}${originalDecimalPart}`
    if (selectionStart < value.length) {
      if (originalIntegerPart.length > maxIntStringLength) {
        const originalIntegerPartArray = [...originalIntegerPart]
        originalIntegerPartArray.splice(selectionStart - 1, 1)
        newValue = `${originalIntegerPartArray.join('')}${originalDecimalPart}`
      }
    }

    return {
      ...response,
      parsedValue: parseFloat(`${safeIntegerPart}.${decimalPart}`),
      value: newValue,
    }
  }

  const getMaskedValue = (ev) => {
    const parsedVal = parseValue(ev)
    ev.target.parsedValue = parsedVal.parsedValue
    ev.target.originalValue = parsedVal.originalValue
    return parsedVal.value || ev.target.value
  }

  useEffect(() => {
    setValue(props.value)
  }, [props.value])

  return (
    <Input
      {...props}
      value={value}
      mask={mask}
      getMaskedValue={getMaskedValue}
      justNumbers
      disabled={transactionMode === AppInfo.ML_TRANSACTION_MODES.DELEGATION}
    />
  )
}

export default InputBTC
