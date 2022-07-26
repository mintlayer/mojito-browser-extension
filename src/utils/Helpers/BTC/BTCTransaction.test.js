import { nonSegwitFilter, isTransactionSegwit } from './BTCTransaction'

test('Filter non-segwit', () => {
  const result = nonSegwitFilter({
    vin: [{ witness: [] }, { witness: [] }],
  })

  expect(result).toBeTruthy()
})

test('Is Segwit', () => {
  const result = isTransactionSegwit({
    vin: [{ witness: [] }, { witness: [] }],
  })

  expect(result).toBeFalsy()
})
