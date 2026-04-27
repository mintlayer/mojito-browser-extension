import { AppInfo } from '@Constants'
import { getNumber } from './Format'
const INTEGER_LENGHT_THRESHOLD = 2
const SAFE_INTEGER_LENGTH =
  Number.MAX_SAFE_INTEGER.toString().length - INTEGER_LENGHT_THRESHOLD

const getSafeIntegerPart = (integer) =>
  integer.toString().substring(0, SAFE_INTEGER_LENGTH)

const floatStringToNumber = (value = '') => {
  const parsedValue = value
    .toString()
    .replaceAll(AppInfo.thousandsSeparator, '')
    .replace(AppInfo.decimalSeparator, '.')
  return parseFloat(parsedValue)
}

const getDecimalNumber = (value) => {
  const num = getNumber(value)
  if (num >= 0.01) return num.toFixed(2)
  if (num === 0) return '0.00'
  const significantDigits = 2
  return num.toPrecision(significantDigits)
}

const isInteger = (number) => number === ~~number

export {
  getSafeIntegerPart,
  SAFE_INTEGER_LENGTH,
  floatStringToNumber,
  getDecimalNumber,
  isInteger,
}
