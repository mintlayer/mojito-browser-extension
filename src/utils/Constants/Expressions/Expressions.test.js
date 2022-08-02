import { USFormatTests, nonUSFormatTests } from './expressionsTestData'
import Expressions from './Expressions'

const matchesAsExpected = (regex) => (testData) => {
  const matches = testData.test.match(regex)
  const asExpected =
    matches[1] === testData.expectedInt && matches[5] === testData.expectedDec

  if (!asExpected) {
    console.log(matches[1], testData.expectedInt)
    console.log(matches[5], testData.expectedDec)
    console.error('Regex Not Matched\n', testData, '\n', {
      int: matches[1] === testData.expectedInt,
      dec: matches[5] === testData.expectedDec,
    })
  }

  return asExpected
}

test('US formatted float', () => {
  const regex = Expressions.FIELDS.FLOAT.getExpression('.', ',')
  expect(USFormatTests.every(matchesAsExpected(regex))).toBeTruthy()
})

test('non-US formatted float', () => {
  const regex = Expressions.FIELDS.FLOAT.getExpression(',', '.')
  expect(nonUSFormatTests.every(matchesAsExpected(regex))).toBeTruthy()
})
