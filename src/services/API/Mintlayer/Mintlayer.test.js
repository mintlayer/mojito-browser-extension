import {
  getAddressData,
  getAddressBalance,
  getAddressTransactionIds,
  getTransactionData,
  getAddressTransactions,
  requestMintlayer,
} from './Mintlayer.js'

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

test('Mintlayer API request', async () => {
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

  await expect(requestMintlayer(fetchAddr, null, mockFetch)).resolves.toMatch(
    fetchAddr,
  )
})

test('Mintlayer API request - not ok', async () => {
  const fetchAddr = 'testFetch'
  const mockFetch = jest.fn((addr) => {
    return new Promise((resolve, reject) =>
      resolve({
        ok: false,
      }),
    )
  })

  await expect(async () => {
    await requestMintlayer(fetchAddr, null, mockFetch)
  }).rejects.toThrowError()
})
const TESTNET_WALLET = 'tmt1q996a4kpq2ds4snvvgszud6xfhlkcxj7xysjtamj'
const TX_ID = '7cbfabe0dec48e36e431ba07567e6b54cf74d7cdb7d23e0d673d958ec2b57894'
const BLOCK_ID =
  'f35d338feab24baa593997e102c0f11d1808d42ad6971fde5a9dc9754884e0e5'
const FIRST_BLOCK_ID =
  'f77e0a23652c01caaeaee29b87939cede82b48f552d029b6d665ed253f75eb2a'
const FIRST_TX_ID =
  '59dbe0bc386ad2489f065e68372154216f7286db7385616ab8bb275477f6d0d5'

test('getAddressData', async () => {
  const result = await getAddressData(TESTNET_WALLET)
  const data = JSON.parse(result)
  expect(data.coin_balance).toBeGreaterThan(0)
  const firstTransactionId =
    data.transaction_history[data.transaction_history.length - 1]
  expect(data.transaction_history.length).toBeGreaterThan(0)
  expect(firstTransactionId).toBe(FIRST_TX_ID)
})

test('Mintlayer API request - getTransactionData', async () => {
  const result = await getTransactionData(TX_ID)
  expect(result.block_id).toBe(BLOCK_ID)
})

test('Mintlayer API request - getAddressTransactionIds', async () => {
  const result = await getAddressTransactionIds(TESTNET_WALLET)
  expect(result.length).toBeGreaterThan(0)
  expect(result[result.length - 1]).toBe(FIRST_TX_ID)
})

test('Mintlayer API request - getAdressTransactions', async () => {
  const result = await getAddressTransactions(TESTNET_WALLET)
  expect(result.length).toBeGreaterThan(0)
  expect(result[result.length - 1].block_id).toBe(FIRST_BLOCK_ID)
})

test('Mintlayer API request - getAddressBalance', async () => {
  const result = await getAddressBalance(TESTNET_WALLET)
  expect(result.balanceInAtoms).toBeGreaterThan(0)
})
