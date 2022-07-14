import {
  parseFeesEstimates,
  formatBTCValue
} from './BTC'

import fees from './fees.json'

test('Parse Fees Estimates', () => {
  const estimates = parseFeesEstimates(fees)
  expect(estimates.LOW).toBeLessThan(estimates.MEDIUM)
  expect(estimates.MEDIUM).toBeLessThan(estimates.HIGH)
})

test('BTC helpers', () => {
  let value = 0.6
  expect(formatBTCValue(value)).toBe('0.6')

  value = 0.6
  expect(formatBTCValue(value)).toBe('0.6')

  value = 0.60000001
  expect(formatBTCValue(value)).toBe('0.60000001')

  value = 6
  expect(formatBTCValue(value)).toBe('6')

  value = 6.3
  expect(formatBTCValue(value)).toBe('6.3')

  value = 6.324
  expect(formatBTCValue(value)).toBe('6.324')

  value = 6.30000001
  expect(formatBTCValue(value)).toBe('6.30000001')
})
