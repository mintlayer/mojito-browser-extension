import { getNRandomElementsFromArray } from './Array'

const ARRAY_SAMPLE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

test('Get N Random Elements From Array', () => {
  const n = 5
  const result = getNRandomElementsFromArray(ARRAY_SAMPLE, n)

  expect(result).toHaveLength(n)
  result.forEach((element) => {
    expect(ARRAY_SAMPLE).toContain(element)
  })
})

test('Get N Random Elements From Array - Error', () => {
  const n = 20

  expect(() => {
    getNRandomElementsFromArray(ARRAY_SAMPLE, n)
  }).toThrow()
})
