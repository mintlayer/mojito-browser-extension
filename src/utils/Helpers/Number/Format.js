import { AppInfo } from '@Constants'
import { NumbersHelper } from '@Helpers'

const getNumber = (value) =>
  typeof value === 'number' ? value : NumbersHelper.floatStringToNumber(value)

const BTCValue = (value) =>
  getNumber(value)
    .toFixed(8)
    .replace(/\.0+$/, '')
    .replace(/(\.0{0,}[1-9]+)(0+)$/, '$1')
    .replace('.', AppInfo.decimalSeparator)

const fiatValue = (value) =>
  (Math.trunc(getNumber(value) * 100) / 100)
    .toFixed(2)
    .replace('.', AppInfo.decimalSeparator)

export { BTCValue, fiatValue }
