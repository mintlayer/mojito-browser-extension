import * as AppInfo from '../../Constants/AppInfo/AppInfoCore'
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

const getNumber = (value) =>
  typeof value === 'number' ? value : floatStringToNumber(value)

const getDecimalNumber = (value) => {
  const num = getNumber(value)
  if (num >= 0.01) return num.toFixed(2)
  if (num === 0) return '0.00'
  const significantDigits = 2
  return num.toPrecision(significantDigits)
}

const isInteger = (number) => Number.isInteger(number)

export {
  getSafeIntegerPart,
  SAFE_INTEGER_LENGTH,
  floatStringToNumber,
  getNumber,
  getDecimalNumber,
  isInteger,
}
