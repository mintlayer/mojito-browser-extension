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

const atomsToDecimal = (atoms, decimals) => {
  // BigInt() directly: Number(atoms) would silently corrupt values above
  // 2^53 (ML has 11 decimals, so ~90,000 ML is already out of float range).
  const atomsBigInt = typeof atoms === 'bigint' ? atoms : BigInt(atoms)
  const divisor = BigInt(10 ** decimals)
  const quotient = atomsBigInt / divisor
  const remainder = atomsBigInt % divisor

  // Convert remainder to decimal string, padded with zeros if needed
  const fractional = remainder
    .toString()
    .padStart(decimals, '0')
    .replace(/0+$/, '')
  return fractional ? `${quotient}.${fractional}` : `${quotient}`
}

const fiatValue = (value) =>
  getDecimalNumber(value).replace('.', AppInfo.decimalSeparator)

export { BTCValue, fiatValue, getNumber, atomsToDecimal }
