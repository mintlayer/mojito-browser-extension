import { useState, useContext } from 'react'
import { AppInfo, Expressions } from '@Constants'
import { NumbersHelper } from '@Helpers'
import Input from './Input'
import { INTEGER_PART, DECIMAL_PART } from './inputMaskConstants'

import { TransactionContext } from '@Contexts'

const escapeRegex = (separator) =>
  separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const InputBTC = (props) => {
  const { transactionMode } = useContext(TransactionContext)
  const mask = Expressions.FIELDS.BTC.getExpression(
    AppInfo.decimalSeparator,
    AppInfo.thousandsSeparator,
    props.decimals,
  )

  // Breakers = every separator the mask/parser must treat as removable:
  // the app decimal separator plus the commonly typed ','.
  // The thousands separator is excluded on purpose: Input.tsx's justNumbers
  // guard rejects any value containing spaces before the mask ever runs.
  const breakersRegex = new RegExp(
    `[${escapeRegex(AppInfo.decimalSeparator)},]`,
    'g',
  )
  // ',' is a legacy typed thousands separator — never a decimal separator
  // in this app; strip it so the mask stays authoritative.
  const normalizeSeparators = (value) =>
    AppInfo.decimalSeparator === ',' ? value : value.replaceAll(',', '')

  const [value, setValue] = useState(props.value || '')
  const [prevPropsValue, setPrevPropsValue] = useState(props.value)

  if (props.value !== prevPropsValue) {
    setPrevPropsValue(props.value)
    setValue(props.value)
  }

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

  const parseValue = (rawValue, selectionStart) => {
    const value = normalizeSeparators(rawValue)
    const matchedValue = value.match(mask)
    const response = { originalValue: rawValue }
    if (!value) return { ...response, parsedValue: 0 }

    const maskBreakers = parseCommasAndDots(value)
    if (!maskBreakers) {
      return {
        ...response,
        parsedValue: parseInt(value),
        value: matchedValue?.[INTEGER_PART] ?? '',
      }
    }

    if (!matchedValue) return { ...response, parsedValue: NaN, value: '' }

    const [originalIntegerPart, originalDecimalPart] = [
      matchedValue[INTEGER_PART],
      matchedValue[DECIMAL_PART] || '',
    ]
    const [integerPart, decimalPart] = [
      removeBreakers(originalIntegerPart),
      removeBreakers(originalDecimalPart),
    ]

    const safeIntegerPart = NumbersHelper.getSafeIntegerPart(integerPart)
    const maxIntStringLength = NumbersHelper.SAFE_INTEGER_LENGTH
    let newValue = `${originalIntegerPart.substring(
      0,
      maxIntStringLength,
    )}${originalDecimalPart}`
    if (selectionStart < value.length) {
      if (originalIntegerPart.length > maxIntStringLength) {
        const originalIntegerPartArray = [...originalIntegerPart]
        const caretIndex = Math.min(selectionStart, originalIntegerPart.length)
        const removeIndex = Math.min(
          Math.max(caretIndex - 1, 0),
          originalIntegerPartArray.length - 1,
        )
        originalIntegerPartArray.splice(removeIndex, 1)
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
    const parsedVal = parseValue(ev.target.value, ev.target.selectionStart)
    ev.target.parsedValue = parsedVal.parsedValue
    ev.target.originalValue = parsedVal.originalValue
    return parsedVal.value ?? ''
  }

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
