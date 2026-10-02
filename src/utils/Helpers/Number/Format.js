import * as AppInfo from '../../Constants/AppInfo/AppInfoCore'
import Decimal from 'decimal.js'
import { getDecimalNumber, getNumber } from './Number'

const BTCValue = (value) => {
  const num = getNumber(value)
  if (!Number.isFinite(num)) return ''
  // toFixed on Decimal: float toString emits exponent notation ("1e-8")
  // for tiny values, which the decimal slicing below cannot handle.
  return new Decimal(num)
    .toFixed(8)
    .replace(/0+$/, '')
    .replace(/\.$/, '')
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
