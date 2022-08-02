import { AppInfo } from '@Constants'

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

  return Number(parsedValue)
}

export { getSafeIntegerPart, SAFE_INTEGER_LENGTH, floatStringToNumber }
