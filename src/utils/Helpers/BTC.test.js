import {
  calculateBalanceFromUtxoList,
  convertSatoshiToBtc,
  getParsedTransactions,
  getConfirmationsAmount,
  parseFeesEstimates,
  formatBTCValue
} from './BTC'

import fees from './fees.json'
import rawTransactions from './testTransactions.json'
import utxos from '../../services/Crypto/BTC/testUtxos.json'

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

test('Calculate Balance From Utxo List', () => {
  const balance = 2075724
  const satoshiAmount = calculateBalanceFromUtxoList(utxos)
  expect(satoshiAmount).toBe(balance)
})

test('Satoshi to BTC', () => {
  const satoshi1 = 100_000_000
  const balance1 = 1
  const satoshi2 = 1_000_000_000
  const balance2 = 10
  const satoshi3 = 1_000
  const balance3 = 0.00001

  const resultBalance1 = convertSatoshiToBtc(satoshi1)
  const resultBalance2 = convertSatoshiToBtc(satoshi2)
  const resultBalance3 = convertSatoshiToBtc(satoshi3)

  expect(resultBalance1).toBe(balance1)
  expect(resultBalance2).toBe(balance2)
  expect(resultBalance3).toBe(balance3)
})

test('Transactions parse', async () => {
  const address = '2MyEpfT2SxQjVRipzTEzxSRPyerpoENmAom'
  const randomIndex = Math.floor(Math.random() * (rawTransactions.length - 1))

  const parsedTransactions = getParsedTransactions(rawTransactions, address)

  const inTransactionsAmount = parsedTransactions.reduce(
    (acc, item) => (item.direction === 'in' ? acc + 1 : acc),
    0,
  )

  expect(parsedTransactions.length).toBe(parsedTransactions.length)
  expect(inTransactionsAmount).toBe(24)

  expect(typeof parsedTransactions[randomIndex].txid).toBe('string')
  expect(typeof parsedTransactions[randomIndex].direction).toBe('string')
  expect(typeof parsedTransactions[randomIndex].value).toBe('number')
  expect(parsedTransactions[randomIndex].otherPart.length).toBeGreaterThan(0)
})

test('Check confirmations amount - error', async () => {
  await expect(getConfirmationsAmount()).rejects.toThrow()
})

test('Check confirmations amount - success', async () => {
  const transaction = {
    blockHeight: 10_000,
  }

  const confirmations = await getConfirmationsAmount(transaction)
  expect(confirmations).toBeGreaterThan(1_000_000)
})
