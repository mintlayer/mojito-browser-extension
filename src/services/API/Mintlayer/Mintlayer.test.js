import {
  getAddressData,
  getAddressBalance,
  requestMintlayer,
} from './Mintlayer.js'

import { AppInfo } from '@Constants'

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

test('getAddressData', async () => {
  const result = await getAddressData(TESTNET_WALLET)
  const data = JSON.parse(result)
  expect(data.coin_balance).toBeGreaterThan(0)
})

test('Mintlayer API request - getAddressBalance', async () => {
  const result = await getAddressBalance(TESTNET_WALLET)
  expect(result.balanceInAtoms).toBeGreaterThan(0)
  expect(result.balanceInCoins).toBeGreaterThan(0)
  expect(result.balanceInCoins).toBe(
    result.balanceInAtoms / AppInfo.ML_ATOMS_PER_COIN,
  )
})
