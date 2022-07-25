import { parseFeesEstimates } from './BTC'

import fees from './fees.json'

test('Parse Fees Estimates', () => {
  const estimates = parseFeesEstimates(fees)
  expect(estimates.LOW).toBeLessThan(estimates.MEDIUM)
  expect(estimates.MEDIUM).toBeLessThan(estimates.HIGH)
})
