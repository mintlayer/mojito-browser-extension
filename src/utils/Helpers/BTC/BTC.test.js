import {
  calculateBalanceFromUtxoList,
  convertSatoshiToBtc,
  getParsedTransactions,
  getConfirmationsAmount,
  parseFeesEstimates,
  convertBtcToSatoshi,
} from './BTC'

import { localStorageMock } from 'src/tests/mock/localStorage/localStorage'
import { LocalStorageService } from '@Storage'

import { fees, rawTransactions, utxos } from '@TestData'

Object.defineProperty(window, 'localStorage', { value: localStorageMock })
const mockId = 'networkType'
const mockValue = 'testnet'
LocalStorageService.setItem(mockId, mockValue)

test('Parse Fees Estimates', () => {
  const estimates = parseFeesEstimates(fees)
  expect(estimates.LOW).toBeLessThan(estimates.MEDIUM)
  expect(estimates.MEDIUM).toBeLessThan(estimates.HIGH)
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

test('BTC to Satoshi', () => {
  const BTC1 = 0.00001
  const BTC2 = 0.00002
  const BTC3 = 0.00003
  const BTC4 = 0.00004
  const BTC5 = 0.00005
  const BTC6 = 0.00006
  const BTC7 = 0.00007
  const BTC8 = 0.00008
  const BTC9 = 0.00009
  const BTC10 = 1

  const satoshi1 = 1000
  const satoshi2 = 2000
  const satoshi3 = 3000
  const satoshi4 = 4000
  const satoshi5 = 5000
  const satoshi6 = 6000
  const satoshi7 = 7000
  const satoshi8 = 8000
  const satoshi9 = 9000
  const satoshi10 = 100000000

  const resultBalance1 = convertBtcToSatoshi(BTC1)
  const resultBalance2 = convertBtcToSatoshi(BTC2)
  const resultBalance3 = convertBtcToSatoshi(BTC3)
  const resultBalance4 = convertBtcToSatoshi(BTC4)
  const resultBalance5 = convertBtcToSatoshi(BTC5)
  const resultBalance6 = convertBtcToSatoshi(BTC6)
  const resultBalance7 = convertBtcToSatoshi(BTC7)
  const resultBalance8 = convertBtcToSatoshi(BTC8)
  const resultBalance9 = convertBtcToSatoshi(BTC9)
  const resultBalance10 = convertBtcToSatoshi(BTC10)

  expect(resultBalance1).toBe(satoshi1)
  expect(resultBalance2).toBe(satoshi2)
  expect(resultBalance3).toBe(satoshi3)
  expect(resultBalance4).toBe(satoshi4)
  expect(resultBalance5).toBe(satoshi5)
  expect(resultBalance6).toBe(satoshi6)
  expect(resultBalance7).toBe(satoshi7)
  expect(resultBalance8).toBe(satoshi8)
  expect(resultBalance9).toBe(satoshi9)
  expect(resultBalance10).toBe(satoshi10)

  expect(resultBalance1).not.toBe(0.00001 * 100000000)
  expect(resultBalance2).not.toBe(0.00002 * 100000000)
  expect(resultBalance7).not.toBe(0.00007 * 100000000)
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
