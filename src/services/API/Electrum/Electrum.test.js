import {
  getLastBlockHash,
  getTransactionData,
  getTransactionStatus,
  getAddressTransactions,
  getAddress,
  getAddressUtxo,
  requestElectrum,
  getLastBlockHeight,
  getFeesEstimates,
  broadcastTransaction,
} from './Electrum.js'

import { localStorageMock } from 'src/tests/mock/localStorage/localStorage.js'

import { LocalStorageService } from '@Storage'

Object.defineProperty(window, 'localStorage', { value: localStorageMock })
const mockId = 'networkType'
const mockValue = 'testnet'
LocalStorageService.setItem(mockId, mockValue)

jest.spyOn(console, 'warn').mockImplementation(() => {
  console.warn.restoreMock()
})

jest.useRealTimers()

test('Electrum request', async () => {
  jest.spyOn(console, 'error').mockImplementation((err) => {
    expect(err).toBeInstanceOf(Error)
    console.error.restoreMock()
  })

  const fetchAddr = 'testFetch'
  const mockFetch = jest.fn((addr) => {
    return new Promise((resolve, reject) => {
      resolve({
        ok: true,
        text: async () => new Promise((resolve) => resolve(fetchAddr)),
      })
    })
  })

  await expect(requestElectrum(fetchAddr, null, mockFetch)).resolves.toMatch(
    fetchAddr,
  )
})

test('Electrum resquest - not ok', async () => {
  const fetchAddr = 'testFetch'
  const mockFetch = jest.fn((addr) => {
    return new Promise((resolve, reject) =>
      resolve({
        ok: false,
      }),
    )
  })

  await expect(async () => {
    await requestElectrum(fetchAddr, null, mockFetch)
  }).rejects.toThrowError()
})

// https://www.blockchain.com/btc-testnet/tx/f0315ffc38709d70ad5647e22048358dd3745f3ce3874223c80a7c92fab0c8ba
const FIRST_TX_ID =
  'f0315ffc38709d70ad5647e22048358dd3745f3ce3874223c80a7c92fab0c8ba'
const FIRST_TESTNET_WALLET = 'n3GNqMveyvaPvUbH469vDRadqpJMPc84JA'
const BLOCK_HASH_LENGTH = 64

test('Electrum request - getLastBlockHash', async () => {
  await expect(getLastBlockHash()).resolves.toHaveLength(BLOCK_HASH_LENGTH)
})

test('Electrum request - getLastBlockHeight', async () => {
  await expect(getLastBlockHeight()).resolves.not.toBeFalsy()
})

test('Electrum request - getAdressTransactions', async () => {
  const result = await getAddressTransactions(FIRST_TESTNET_WALLET)
  const transactions = JSON.parse(result)
  expect(transactions.length).toBeGreaterThan(0)
})

test('Electrum request - getAddress', async () => {
  const result = await getAddress(FIRST_TESTNET_WALLET)
  const address = JSON.parse(result)
  expect(address.address).toBe(FIRST_TESTNET_WALLET)
})

test('Electrum request - getTransactionStatus', async () => {
  const result = await getTransactionStatus(FIRST_TX_ID)
  const status = JSON.parse(result)
  expect(status.confirmed).toBeTruthy()
})

test('Electrum request - getTransactionData', async () => {
  const result = await getTransactionData(FIRST_TX_ID)
  const data = JSON.parse(result)
  expect(data.status.block_height).toBe(1)
})

test('Electrum request - getAdressUtxo', async () => {
  jest.setTimeout(5000)
  const result = await getAddressUtxo(FIRST_TESTNET_WALLET)
  const transactions = JSON.parse(result)
  expect(transactions.length).toBeGreaterThan(0)
})

test('Electrum request - getFeesEstimates', async () => {
  const result = await getFeesEstimates()
  const fees = JSON.parse(result)
  expect(Object.keys(fees).length).toBe(28)
})

test('Electrum request - broadcastTransaction', async () => {
  await expect(
    async () => await broadcastTransaction({}),
  ).rejects.toThrowError()
  expect(console.warn).toHaveBeenCalled()
})
