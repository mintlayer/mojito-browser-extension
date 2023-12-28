import { AppInfo } from '@Constants'
import { NumbersHelper } from '@Helpers'
import { getDecimalNumber } from './Number'

const getNumber = (value) =>
  typeof value === 'number' ? value : NumbersHelper.floatStringToNumber(value)

//TODO fix the value
// const BTCValue = (value) =>
//   getNumber(value)
//     .toFixed(8)
//     .replace(/\.0+$/, '')
//     .replace(/(\.0{0,}[1-9]+)(0+)$/, '$1')
//     .replace('.', AppInfo.decimalSeparator)

const BTCValue = (value) => {
  let str = getNumber(value).toString()
  const decimalIndex = str.indexOf('.')
  if (decimalIndex !== -1) {
    str = str.slice(0, decimalIndex + 9) // Keep up to 8 decimal places 41.77386240774
  }
  return str
    .replace(/\.0+$/, '')
    .replace(/(\.0{0,}[1-9]+)(0+)$/, '$1')
    .replace('.', AppInfo.decimalSeparator)
}

const fiatValue = (value) =>
  getDecimalNumber(value).replace('.', AppInfo.decimalSeparator)

export { BTCValue, fiatValue, getNumber }
