import { AppInfo } from '@Constants'
import { NumbersHelper } from '@Helpers'
import { getDecimalNumber } from './Number'

const getNumber = (value) =>
  typeof value === 'number' ? value : NumbersHelper.floatStringToNumber(value)

const BTCValue = (value) => {
  let str = getNumber(value).toString()
  const decimalIndex = str.indexOf('.')
  if (decimalIndex !== -1) {
    str = str.slice(0, decimalIndex + 9)
  }
  return str
    .replace(/\.0+$/, '')
    .replace(/(\.0{0,}[1-9]+)(0+)$/, '$1')
    .replace('.', AppInfo.decimalSeparator)
}

const fiatValue = (value) =>
  getDecimalNumber(value).replace('.', AppInfo.decimalSeparator)

export { BTCValue, fiatValue, getNumber }
